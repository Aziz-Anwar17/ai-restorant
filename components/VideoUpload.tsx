"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ClipResults, { type Clip } from "./ClipResults";
import { useAuth, authedFetch } from "./AuthProvider";

type VideoMeta = {
  id: string;
  name: string;
  durationSec: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  source: "upload" | "youtube";
};

type Phase = "idle" | "uploading" | "uploaded" | "processing" | "completed" | "failed";

type JobState = {
  id: string;
  status: string;
  progress: number;
  totalClips: number;
  completedClips: number;
  error: string | null;
};

const STAGES: { key: string; label: string; statuses: string[] }[] = [
  { key: "upload", label: "Video ready", statuses: [] },
  { key: "downloading", label: "Fetching video", statuses: ["downloading"] },
  { key: "audio", label: "Extracting audio", statuses: ["extracting_audio"] },
  { key: "transcript", label: "Generating transcript", statuses: ["transcribing"] },
  { key: "moments", label: "Finding the best moments", statuses: ["analyzing", "selecting_clips"] },
  { key: "render", label: "Rendering clips & captions", statuses: ["rendering", "captioning"] },
  { key: "final", label: "Finalizing", statuses: ["finalizing"] },
];

const STATUS_ORDER = [
  "queued", "downloading", "extracting_audio", "transcribing", "analyzing",
  "selecting_clips", "rendering", "captioning", "finalizing", "completed",
];

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtSize(bytes?: number): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

export default function VideoUpload() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [clipCount, setClipCount] = useState(10);
  const [dragOver, setDragOver] = useState(false);
  const [pipelineReady, setPipelineReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setPipelineReady(Boolean(d.ready)))
      .catch(() => setPipelineReady(null));
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { refreshProfile } = useAuth();

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);
  useEffect(() => stopPolling, [stopPolling]);

  const reset = () => {
    stopPolling();
    setPhase("idle");
    setVideo(null);
    setJob(null);
    setClips([]);
    setError(null);
    setYtUrl("");
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setPhase("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/videos/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setVideo(data.video);
      setPhase("uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't upload your video. Please try again.");
      setPhase("idle");
    }
  };

  const analyzeYouTube = async () => {
    if (!ytUrl.trim()) return;
    setError(null);
    setPhase("uploading");
    try {
      const res = await fetch("/api/videos/from-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't read that link.");
      setVideo(data.video);
      setPhase("uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't read that YouTube link.");
      setPhase("idle");
    }
  };

  const generateClips = async () => {
    if (!video) return;
    setError(null);
    try {
      const res = await authedFetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, clipCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start processing.");
      setPhase("processing");
      const jobId: string = data.jobId;
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/jobs/${jobId}`);
          const d = await r.json();
          if (!r.ok) throw new Error(d.error ?? "Job lookup failed");
          setJob(d.job);
          if (d.job.status === "completed") {
            stopPolling();
            setClips(d.clips);
            setPhase("completed");
            refreshProfile(); // credits may have been deducted/refunded
          } else if (d.job.status === "failed") {
            stopPolling();
            setError(d.job.error ?? "Processing failed. Please try again.");
            setPhase("failed");
          }
        } catch {
          /* transient poll error — keep polling */
        }
      }, 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start processing.");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // ---------- render ----------

  if (phase === "completed" && job) {
    return (
      <div id="upload" className="mx-auto w-full max-w-5xl scroll-mt-24">
        <ClipResults clips={clips} jobId={job.id} onReset={reset} />
      </div>
    );
  }

  if (phase === "processing") {
    const currentIdx = job ? STATUS_ORDER.indexOf(job.status) : 0;
    return (
      <div id="upload" className="card mx-auto w-full max-w-2xl scroll-mt-24 rounded-3.5xl p-8 text-left">
        <p className="text-center text-lg font-bold text-white">
          Analyzing your video…
        </p>
        <div className="mx-auto mt-5 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-700"
            style={{ width: `${job?.progress ?? 2}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">
          {job ? `${job.progress}%` : "Starting…"}
          {job && job.status === "rendering" && job.totalClips > 0
            ? ` · clip ${Math.min(job.completedClips + 1, job.totalClips)} of ${job.totalClips}`
            : ""}
        </p>
        <ul className="mx-auto mt-6 max-w-sm space-y-2.5">
          {STAGES.filter(
            (s) => s.key !== "downloading" || video?.source === "youtube"
          ).map((s) => {
            const stageIdx =
              s.statuses.length === 0
                ? -1
                : Math.min(...s.statuses.map((st) => STATUS_ORDER.indexOf(st)));
            const done = s.statuses.length === 0 || (job && currentIdx > Math.max(...s.statuses.map((st) => STATUS_ORDER.indexOf(st))));
            const active = job ? s.statuses.includes(job.status) : stageIdx === 0;
            return (
              <li key={s.key} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    done
                      ? "bg-brand text-white"
                      : active
                      ? "border-2 border-brand bg-brand/20 text-brand-soft"
                      : "border border-white/15 text-transparent"
                  }`}
                >
                  {done ? "✓" : active ? "●" : "○"}
                </span>
                <span className={done ? "text-zinc-300" : active ? "font-semibold text-white" : "text-zinc-600"}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-xs text-zinc-600">
          Long videos take a few minutes. You can keep this tab open.
        </p>
      </div>
    );
  }

  if ((phase === "uploaded" || phase === "failed") && video) {
    return (
      <div id="upload" className="card mx-auto w-full max-w-2xl scroll-mt-24 rounded-3.5xl p-6 text-left">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/40 to-ink-700 text-xl">
            🎬
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{video.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {fmtDuration(video.durationSec)}
              {video.width ? ` • ${video.width}×${video.height}` : ""}
              {video.sizeBytes ? ` • ${fmtSize(video.sizeBytes)}` : ""}
              {video.source === "youtube" ? " • YouTube" : ""}
            </p>
          </div>
          <button
            onClick={reset}
            aria-label="Remove video"
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">How many clips?</span>
            {[3, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setClipCount(n)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  clipCount === n
                    ? "bg-brand text-white"
                    : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button onClick={generateClips} className="btn-primary w-full sm:w-auto">
            ✦ Generate Clips
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  // idle / uploading
  return (
    <div id="upload" className="mx-auto w-full max-w-2xl scroll-mt-24">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`card rounded-3.5xl border-dashed p-8 text-center transition ${
          dragOver ? "border-brand/60 bg-brand/5" : ""
        }`}
      >
        {pipelineReady === false && (
          <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-300">
            ⚠ This deployment serves the interface only — video processing runs
            on the AI Restorant processing host, which isn&apos;t connected
            here. Uploads and YouTube analysis won&apos;t work on this page.
          </p>
        )}
        <p className="text-lg font-bold text-white">Upload your video</p>
        <p className="mt-1 text-sm text-zinc-500">
          Drag &amp; drop or choose a file — MP4, MOV, WebM, M4V
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={phase === "uploading"}
          className="btn-primary mt-5 disabled:opacity-60"
        >
          {phase === "uploading" ? "Working…" : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-widest text-zinc-600">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row">
          <input
            type="url"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeYouTube()}
            placeholder="https://youtube.com/watch?v=..."
            aria-label="Paste a YouTube link"
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-ink-900 px-5 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-brand/50"
          />
          <button
            onClick={analyzeYouTube}
            disabled={phase === "uploading" || !ytUrl.trim()}
            className="btn-secondary shrink-0 disabled:opacity-50"
          >
            Analyze Video
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-left text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500">
        No sign-up needed to try it. Processing runs on the AI Restorant pipeline.
      </p>
    </div>
  );
}
