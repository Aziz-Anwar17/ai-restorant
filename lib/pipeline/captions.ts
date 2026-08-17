import type { TranscriptSegment } from "./transcribe";

/**
 * Build an ASS subtitle file for one clip.
 * Whisper gives segment-level timestamps; we split long segments into short
 * caption chunks (max ~5 words) and distribute timing linearly across the
 * segment. Timing within a segment is therefore estimated, but the text and
 * segment boundaries come from the real transcript.
 */

const MAX_WORDS_PER_CAPTION = 5;

function fmtAssTime(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
}

function escapeAss(text: string): string {
  return text.replace(/[{}]/g, "").replace(/\n/g, " ");
}

export function buildAssForClip(
  segments: TranscriptSegment[],
  clipStart: number,
  clipEnd: number
): string {
  const events: { start: number; end: number; text: string }[] = [];

  for (const seg of segments) {
    if (seg.end <= clipStart || seg.start >= clipEnd) continue;
    const words = seg.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const chunks: string[][] = [];
    for (let i = 0; i < words.length; i += MAX_WORDS_PER_CAPTION) {
      chunks.push(words.slice(i, i + MAX_WORDS_PER_CAPTION));
    }
    const segDur = seg.end - seg.start;
    const perChunk = segDur / chunks.length;
    chunks.forEach((chunk, i) => {
      const s = Math.max(seg.start + i * perChunk, clipStart) - clipStart;
      const e = Math.min(seg.start + (i + 1) * perChunk, clipEnd) - clipStart;
      if (e - s < 0.15) return;
      events.push({ start: s, end: e, text: chunk.join(" ") });
    });
  }

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Arial,88,&H00FFFFFF,&H00FFFFFF,&H00101014,&H80000000,1,0,0,0,100,100,0,0,1,6,2,2,90,90,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines = events
    .map(
      (ev) =>
        `Dialogue: 0,${fmtAssTime(ev.start)},${fmtAssTime(ev.end)},Cap,,0,0,0,,${escapeAss(ev.text)}`
    )
    .join("\n");

  return header + lines + "\n";
}
