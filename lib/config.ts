import path from "path";
import os from "os";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",

  whisperBin: process.env.WHISPER_CPP_BIN ?? "/opt/homebrew/bin/whisper-cli",
  whisperModel:
    process.env.WHISPER_MODEL ??
    path.join(os.homedir(), ".cache/whisper-cpp/ggml-small.bin"),
  whisperLanguage: process.env.WHISPER_LANGUAGE ?? "auto",

  ffmpegBin: process.env.FFMPEG_BIN ?? "ffmpeg",
  ffprobeBin: process.env.FFPROBE_BIN ?? "ffprobe",
  ytdlpBin: process.env.YTDLP_BIN ?? "yt-dlp",

  maxVideoSizeMb: num(process.env.MAX_VIDEO_SIZE_MB, 2000),
  maxVideoDurationMin: num(process.env.MAX_VIDEO_DURATION_MIN, 180),
  creditsPerClip: num(process.env.CREDITS_PER_CLIP, 1),
  freeCredits: num(process.env.FREE_CREDITS, 90),

  storageDir:
    process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage"),

  allowedVideoTypes: [
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-m4v",
  ],
  allowedVideoExtensions: [".mp4", ".mov", ".webm", ".m4v"],
};

export type DependencyReport = {
  ffmpeg: boolean;
  whisper: boolean;
  ytdlp: boolean;
  anthropic: boolean;
  ready: boolean;
  missing: string[];
};
