import path from "path";
import fs from "fs";
import { run } from "../exec";
import { config } from "../config";
import { storagePaths } from "../storage";
import { buildAssForClip } from "./captions";
import type { TranscriptSegment, TranscriptWord } from "./transcribe";

export type RenderResult = { filePath: string; thumbPath: string };

/**
 * Cut a segment, convert to 1080x1920 (9:16), burn captions, export MP4.
 * Horizontal sources use center crop (face-detection reframing is a documented
 * future upgrade); vertical/square sources are scaled and padded, never
 * destructively cropped.
 */
export async function renderClip(opts: {
  sourcePath: string;
  jobId: string;
  index: number;
  start: number;
  end: number;
  sourceWidth: number;
  sourceHeight: number;
  segments: TranscriptSegment[];
  words?: TranscriptWord[];
}): Promise<RenderResult> {
  const { sourcePath, jobId, index, start, end, sourceWidth, sourceHeight, segments, words } = opts;
  const clipsDir = storagePaths.clips(jobId);
  const thumbsDir = storagePaths.thumbs(jobId);
  const num = String(index + 1).padStart(2, "0");
  const outPath = path.join(clipsDir, `dapur-ai-clip-${num}.mp4`);
  const thumbPath = path.join(thumbsDir, `clip-${num}.jpg`);
  const assPath = path.join(storagePaths.tmp(), `${jobId}-${num}.ass`);

  fs.writeFileSync(assPath, buildAssForClip(segments, start, end, words), "utf8");

  const srcAspect = sourceWidth / sourceHeight;
  const targetAspect = 9 / 16;
  // taller-than-9:16 or exactly 9:16 → scale to width, pad; wider → scale to height, center crop
  const geometry =
    srcAspect <= targetAspect
      ? "scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black"
      : "scale=-2:1920,crop=1080:1920";

  // args go through spawn (no shell), so no outer quotes — escape filter
  // metacharacters in the path for the filtergraph parser only
  const assEscaped = assPath.replace(/\\/g, "\\\\").replace(/([:,\[\]'])/g, "\\$1");
  const vf = `${geometry},subtitles=filename=${assEscaped}`;

  await run(
    config.ffmpegBin,
    [
      "-y",
      "-ss", start.toFixed(3),
      "-to", end.toFixed(3),
      "-i", sourcePath,
      "-vf", vf,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "21",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outPath,
    ],
    { timeoutMs: 30 * 60_000 }
  );

  const mid = start + (end - start) / 2;
  await run(
    config.ffmpegBin,
    [
      "-y",
      "-ss", mid.toFixed(3),
      "-i", sourcePath,
      "-frames:v", "1",
      "-vf", "scale=360:-2",
      thumbPath,
    ],
    { timeoutMs: 60_000 }
  );

  fs.rmSync(assPath, { force: true });
  return { filePath: outPath, thumbPath };
}
