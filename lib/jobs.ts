import fs from "fs";
import { getDb, now, genId } from "./db";
import { storagePaths, cleanupFiles } from "./storage";
import { probeVideo } from "./pipeline/probe";
import { downloadYouTubeVideo } from "./pipeline/youtube";
import { extractAudio, transcribe, type Transcript } from "./pipeline/transcribe";
import { selectClips } from "./pipeline/analyze";
import { renderClip } from "./pipeline/render";
import { refundCredits } from "./auth";
import { config } from "./config";

export type JobStatus =
  | "queued"
  | "downloading"
  | "extracting_audio"
  | "transcribing"
  | "analyzing"
  | "selecting_clips"
  | "rendering"
  | "captioning"
  | "finalizing"
  | "completed"
  | "failed";

// Progress checkpoints per stage (rendering fills 55→95 by clip count)
const STAGE_PROGRESS: Record<JobStatus, number> = {
  queued: 0,
  downloading: 8,
  extracting_audio: 16,
  transcribing: 25,
  analyzing: 45,
  selecting_clips: 52,
  rendering: 55,
  captioning: 55,
  finalizing: 95,
  completed: 100,
  failed: 0,
};

function setStatus(jobId: string, status: JobStatus, progress?: number) {
  getDb()
    .prepare(
      "UPDATE processing_jobs SET status=?, progress=?, updated_at=? WHERE id=?"
    )
    .run(status, progress ?? STAGE_PROGRESS[status], now(), jobId);
}

function setFailed(jobId: string, userMessage: string, err: unknown) {
  console.error(`[job ${jobId}] failed:`, err);
  getDb()
    .prepare(
      "UPDATE processing_jobs SET status='failed', error=?, updated_at=? WHERE id=?"
    )
    .run(userMessage, now(), jobId);
}

async function runJob(jobId: string) {
  const db = getDb();
  const job = db
    .prepare("SELECT * FROM processing_jobs WHERE id=?")
    .get(jobId) as {
    id: string;
    video_id: string;
    total_clips: number;
    user_id: string | null;
  };
  const video = db
    .prepare("SELECT * FROM videos WHERE id=?")
    .get(job.video_id) as {
    id: string;
    source: string;
    source_url: string | null;
    file_path: string | null;
    duration_sec: number | null;
    width: number | null;
    height: number | null;
  };

  const tempFiles: string[] = [];
  try {
    // 1. Ensure we have a local file
    let filePath = video.file_path;
    if (!filePath) {
      if (video.source !== "youtube" || !video.source_url) {
        throw new Error("Video has no file and no source URL");
      }
      setStatus(jobId, "downloading");
      filePath = await downloadYouTubeVideo(video.source_url, video.id);
      const info = await probeVideo(filePath);
      db.prepare(
        "UPDATE videos SET file_path=?, duration_sec=?, width=?, height=?, size_bytes=? WHERE id=?"
      ).run(
        filePath,
        info.durationSec,
        info.width,
        info.height,
        fs.statSync(filePath).size,
        video.id
      );
      video.duration_sec = info.durationSec;
      video.width = info.width;
      video.height = info.height;
    }

    // 2. Extract audio
    setStatus(jobId, "extracting_audio");
    const wavPath = await extractAudio(filePath, video.id);
    tempFiles.push(wavPath);

    // 3. Transcribe
    setStatus(jobId, "transcribing");
    const transcript: Transcript = await transcribe(wavPath, video.id);

    // 4-5. Analyze + select clips
    setStatus(jobId, "analyzing");
    const plan = await selectClips(
      transcript,
      job.total_clips,
      video.duration_sec ?? 0
    );
    setStatus(jobId, "selecting_clips");

    // 6-8. Render each clip (cut + 9:16 + captions burned in)
    const insertClip = db.prepare(
      `INSERT INTO clips (id, job_id, idx, title, start_sec, end_sec, score, reason, hook, caption, platforms, file_path, thumb_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < plan.clips.length; i++) {
      const c = plan.clips[i];
      const pct = 55 + Math.round(((i + 1) / plan.clips.length) * 40);
      setStatus(jobId, "rendering", pct - 2);
      const { filePath: clipPath, thumbPath } = await renderClip({
        sourcePath: filePath,
        jobId,
        index: i,
        start: c.start,
        end: c.end,
        sourceWidth: video.width ?? 1920,
        sourceHeight: video.height ?? 1080,
        segments: transcript.segments,
        words: transcript.words,
      });
      insertClip.run(
        genId("clip"),
        jobId,
        i,
        c.title,
        c.start,
        c.end,
        c.score,
        c.reason,
        c.hook,
        c.caption,
        JSON.stringify(c.platforms),
        clipPath,
        thumbPath,
        now()
      );
      db.prepare(
        "UPDATE processing_jobs SET completed_clips=?, updated_at=? WHERE id=?"
      ).run(i + 1, now(), jobId);
    }

    setStatus(jobId, "finalizing");
    cleanupFiles(tempFiles);
    setStatus(jobId, "completed");
    // refund credits for clips the AI chose not to produce
    if (job.user_id && plan.clips.length < job.total_clips) {
      refundCredits(
        job.user_id,
        (job.total_clips - plan.clips.length) * config.creditsPerClip,
        jobId
      );
    }
  } catch (err) {
    cleanupFiles(tempFiles);
    // failed run → full refund
    if (job.user_id) {
      refundCredits(job.user_id, job.total_clips * config.creditsPerClip, jobId);
    }
    // Only surface messages we wrote for users (configuration problems);
    // everything else gets a safe stage-specific message, details go to logs.
    const msg =
      err instanceof Error &&
      /is not configured|is missing|Set WHISPER_|in \.env\.local|Only YouTube links|may be too short/.test(
        err.message
      )
        ? err.message
        : stageMessage(jobId);
    setFailed(jobId, msg, err);
  }
}

function stageMessage(jobId: string): string {
  const job = getDb()
    .prepare("SELECT status FROM processing_jobs WHERE id=?")
    .get(jobId) as { status: JobStatus } | undefined;
  switch (job?.status) {
    case "downloading":
      return "We couldn't download this video. Please check the link and try again.";
    case "extracting_audio":
      return "We couldn't read the audio from this video. Please try another file.";
    case "transcribing":
      return "We couldn't transcribe this video. Please try again.";
    case "analyzing":
    case "selecting_clips":
      return "AI Restorant couldn't identify clips from this video.";
    case "rendering":
    case "captioning":
      return "The clip couldn't be rendered. Please try again.";
    default:
      return "Something went wrong while processing your video. Please try again.";
  }
}

// ---- In-process job queue (single worker, survives dev reloads) ----
type Queue = { chain: Promise<void> };
const g = globalThis as unknown as { __dapurQueue?: Queue; __dapurRecovered?: boolean };
function getQueue(): Queue {
  if (!g.__dapurQueue) g.__dapurQueue = { chain: Promise.resolve() };
  return g.__dapurQueue;
}

// Jobs run in-process, so a server restart orphans anything mid-flight:
// stuck forever at "rendering" with the user's credits held. On the first
// queue touch after boot, fail those jobs and refund — unless a refund for
// that job already exists (double-refund guard).
export function recoverOrphanedJobs() {
  if (g.__dapurRecovered) return;
  g.__dapurRecovered = true;
  const db = getDb();
  const orphans = db
    .prepare(
      `SELECT id, user_id, total_clips, completed_clips FROM processing_jobs
       WHERE status NOT IN ('completed','failed')`
    )
    .all() as { id: string; user_id: string | null; total_clips: number; completed_clips: number }[];
  for (const j of orphans) {
    db.prepare(
      "UPDATE processing_jobs SET status='failed', error=?, updated_at=? WHERE id=?"
    ).run(
      "Processing was interrupted by a server restart. Please try again.",
      now(),
      j.id
    );
    if (j.user_id) {
      const refunded = db
        .prepare(
          "SELECT 1 FROM credit_transactions WHERE job_id=? AND amount > 0 LIMIT 1"
        )
        .get(j.id);
      if (!refunded) {
        refundCredits(
          j.user_id,
          (j.total_clips - j.completed_clips) * config.creditsPerClip,
          j.id
        );
      }
    }
    console.error(`[recovery] orphaned job ${j.id} marked failed`);
  }
}

export function createJob(
  videoId: string,
  totalClips: number,
  userId: string | null = null
): string {
  const db = getDb();
  recoverOrphanedJobs();
  const jobId = genId("job");
  db.prepare(
    `INSERT INTO processing_jobs (id, user_id, video_id, status, progress, total_clips, completed_clips, created_at, updated_at)
     VALUES (?, ?, ?, 'queued', 0, ?, 0, ?, ?)`
  ).run(jobId, userId, videoId, totalClips, now(), now());

  const q = getQueue();
  q.chain = q.chain.then(() => runJob(jobId)).catch(() => {});
  return jobId;
}
