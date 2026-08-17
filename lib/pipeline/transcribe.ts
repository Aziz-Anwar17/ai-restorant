import path from "path";
import fs from "fs";
import { run } from "../exec";
import { config } from "../config";
import { storagePaths } from "../storage";

export type TranscriptSegment = { start: number; end: number; text: string };
export type Transcript = { segments: TranscriptSegment[] };

export async function extractAudio(
  videoPath: string,
  videoId: string
): Promise<string> {
  const wavPath = path.join(storagePaths.audio(), `${videoId}.wav`);
  await run(
    config.ffmpegBin,
    ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wavPath],
    { timeoutMs: 20 * 60_000 }
  );
  return wavPath;
}

/** whisper.cpp JSON offsets are in milliseconds */
export async function transcribe(
  wavPath: string,
  videoId: string
): Promise<Transcript> {
  if (!fs.existsSync(config.whisperBin)) {
    throw new Error(
      `Whisper binary not found at ${config.whisperBin}. Set WHISPER_CPP_BIN in .env.local.`
    );
  }
  if (!fs.existsSync(config.whisperModel)) {
    throw new Error(
      `Whisper model not found at ${config.whisperModel}. Set WHISPER_MODEL in .env.local.`
    );
  }
  const outPrefix = path.join(storagePaths.transcripts(), videoId);
  await run(
    config.whisperBin,
    [
      "-m", config.whisperModel,
      "-f", wavPath,
      "-l", config.whisperLanguage,
      "-oj",
      "-of", outPrefix,
      "-np",
    ],
    { timeoutMs: 60 * 60_000 }
  );
  const jsonPath = `${outPrefix}.json`;
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const segments: TranscriptSegment[] = (raw.transcription ?? [])
    .map((s: { offsets: { from: number; to: number }; text: string }) => ({
      start: s.offsets.from / 1000,
      end: s.offsets.to / 1000,
      text: String(s.text ?? "").trim(),
    }))
    .filter((s: TranscriptSegment) => s.text.length > 0);
  if (segments.length === 0) {
    throw new Error("Transcription produced no speech segments.");
  }
  return { segments };
}
