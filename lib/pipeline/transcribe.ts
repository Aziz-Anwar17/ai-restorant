import path from "path";
import fs from "fs";
import { run } from "../exec";
import { config } from "../config";
import { storagePaths } from "../storage";

export type TranscriptSegment = { start: number; end: number; text: string };
export type TranscriptWord = { start: number; end: number; text: string };
export type Transcript = {
  segments: TranscriptSegment[];
  words: TranscriptWord[];
};

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
      "-ojf", // full JSON: includes token-level timestamps for word-accurate captions
      "-of", outPrefix,
      "-np",
    ],
    { timeoutMs: 60 * 60_000 }
  );
  const jsonPath = `${outPrefix}.json`;
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  type RawToken = { text?: string; offsets?: { from: number; to: number } };
  type RawSeg = {
    offsets: { from: number; to: number };
    text: string;
    tokens?: RawToken[];
  };

  const segments: TranscriptSegment[] = [];
  const words: TranscriptWord[] = [];

  for (const s of (raw.transcription ?? []) as RawSeg[]) {
    const text = String(s.text ?? "").trim();
    if (!text) continue;
    segments.push({
      start: s.offsets.from / 1000,
      end: s.offsets.to / 1000,
      text,
    });
    // Merge subword tokens into words: a token starting with a space (or the
    // first token) opens a new word; special tokens like [_BEG_] are skipped.
    for (const t of s.tokens ?? []) {
      // strip whisper special tokens like [_BEG_], [_TT_664] wherever they appear
      const piece = String(t.text ?? "").replace(/\[_[^\]]*\]/g, "");
      if (!piece.trim() || !t.offsets) continue;
      const startsWord = String(t.text ?? "").startsWith(" ") || words.length === 0;
      if (startsWord) {
        const clean = piece.trim();
        if (!clean) continue;
        words.push({
          start: t.offsets.from / 1000,
          end: t.offsets.to / 1000,
          text: clean,
        });
      } else {
        const last = words[words.length - 1];
        if (last) {
          last.text += piece.trim();
          last.end = t.offsets.to / 1000;
        }
      }
    }
  }

  if (segments.length === 0) {
    throw new Error("Transcription produced no speech segments.");
  }
  return { segments, words };
}
