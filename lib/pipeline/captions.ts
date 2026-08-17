import type { TranscriptSegment, TranscriptWord } from "./transcribe";

/**
 * Build an ASS subtitle file for one clip.
 * Preferred path: word-level timestamps from whisper.cpp tokens — captions are
 * grouped into short phrases with exact word timing. Fallback (no word data):
 * split segments into chunks and distribute timing linearly.
 */

const MAX_WORDS_PER_CAPTION = 5;
const MAX_CAPTION_GAP_SEC = 0.8; // start a new caption after a pause

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

type CaptionEvent = { start: number; end: number; text: string };

function eventsFromWords(
  words: TranscriptWord[],
  clipStart: number,
  clipEnd: number
): CaptionEvent[] {
  const inClip = words.filter((w) => w.end > clipStart && w.start < clipEnd);
  const events: CaptionEvent[] = [];
  let group: TranscriptWord[] = [];

  const flush = () => {
    if (group.length === 0) return;
    const start = Math.max(group[0].start, clipStart) - clipStart;
    const end = Math.min(group[group.length - 1].end, clipEnd) - clipStart;
    if (end - start >= 0.12) {
      events.push({ start, end, text: group.map((w) => w.text).join(" ") });
    }
    group = [];
  };

  for (const w of inClip) {
    const prev = group[group.length - 1];
    const pause = prev ? w.start - prev.end : 0;
    const endsSentence = prev ? /[.!?…]$/.test(prev.text) : false;
    if (
      group.length >= MAX_WORDS_PER_CAPTION ||
      pause > MAX_CAPTION_GAP_SEC ||
      endsSentence
    ) {
      flush();
    }
    group.push(w);
  }
  flush();

  // keep each caption on screen until the next one starts (no flicker gaps)
  for (let i = 0; i < events.length - 1; i++) {
    const gap = events[i + 1].start - events[i].end;
    if (gap > 0 && gap <= MAX_CAPTION_GAP_SEC) events[i].end = events[i + 1].start;
  }
  return events;
}

export function buildAssForClip(
  segments: TranscriptSegment[],
  clipStart: number,
  clipEnd: number,
  words: TranscriptWord[] = []
): string {
  const events: CaptionEvent[] =
    words.length > 0 ? eventsFromWords(words, clipStart, clipEnd) : [];

  if (events.length === 0)
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
