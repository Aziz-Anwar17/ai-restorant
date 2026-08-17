"use client";

import { useState } from "react";

export type Clip = {
  id: string;
  index: number;
  title: string;
  startSec: number;
  endSec: number;
  score: number;
  reason: string;
  hook: string;
  caption: string;
  platforms: string[];
  mediaUrl: string;
  thumbUrl: string;
  downloadUrl: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube_shorts: "Shorts",
  tiktok: "TikTok",
  instagram_reels: "Reels",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
};

function fmtTs(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ClipResults({
  clips,
  jobId,
  onReset,
}: {
  clips: Clip[];
  jobId: string;
  onReset: () => void;
}) {
  const [preview, setPreview] = useState<Clip | null>(null);

  return (
    <div className="text-left">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">Your clips are ready 🎉</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {clips.length} clips generated · 1080×1920 · captions burned in
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/jobs/${jobId}/download-all`} className="btn-primary !px-5 !py-2.5 text-sm">
            ⬇ Download All (ZIP)
          </a>
          <button onClick={onReset} className="btn-secondary !px-5 !py-2.5 text-sm">
            New video
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clips.map((c) => (
          <div
            key={c.id}
            className="card card-hover overflow-hidden rounded-3xl"
          >
            <button
              onClick={() => setPreview(c)}
              className="group relative block w-full"
              aria-label={`Preview ${c.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.thumbUrl}
                alt={c.title}
                className="aspect-video w-full object-cover"
                loading="lazy"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <svg className="ml-0.5 h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
              <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-accent">
                {c.score}
              </span>
            </button>
            <div className="p-4">
              <p className="truncate text-sm font-semibold text-white">
                {String(c.index + 1).padStart(2, "0")}. {c.title}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {fmtTs(c.startSec)} → {fmtTs(c.endSec)} ·{" "}
                {Math.round(c.endSec - c.startSec)}s
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{c.caption}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400"
                  >
                    {PLATFORM_LABELS[p] ?? p}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setPreview(c)}
                  className="btn-secondary flex-1 !px-3 !py-2 text-xs"
                >
                  Preview
                </button>
                <a
                  href={c.downloadUrl}
                  className="btn-primary flex-1 !px-3 !py-2 text-center text-xs"
                >
                  Download MP4
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="card max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{preview.title}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Score {preview.score} · {Math.round(preview.endSec - preview.startSec)}s
                </p>
              </div>
              <button
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>
            <video
              src={preview.mediaUrl}
              controls
              autoPlay
              playsInline
              className="mt-3 aspect-[9/16] w-full rounded-2xl bg-black"
            />
            <a
              href={preview.downloadUrl}
              className="btn-primary mt-3 block w-full text-center text-sm"
            >
              Download MP4
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
