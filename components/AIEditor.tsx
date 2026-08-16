"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const tools = ["Captions", "Crop / Reframe", "B-Roll", "Audio", "Text", "AI Tools"];

export default function AIEditor() {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [ratio, setRatio] = useState("9:16");

  return (
    <section id="ai-editor" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="eyebrow mb-4">✦ AI Editor</p>
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            AI that edits with you, not just for you
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
            Take full editing control, or let our AI take over. Either way,
            it&apos;s effortless.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="card mx-auto mt-14 max-w-5xl overflow-hidden rounded-3.5xl">
            {/* Editor toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
              <div className="flex rounded-full border border-white/10 bg-ink-900 p-1">
                {(["ai", "manual"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      mode === m
                        ? "bg-brand text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {m === "ai" ? "✦ AI Auto Edit" : "Manual Edit"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button aria-label="Undo" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 015 5v1M3 10l5-5M3 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button aria-label="Redo" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 00-5 5v1m15-6l-5-5m5 5l-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <select
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  aria-label="Aspect ratio"
                  className="rounded-lg border border-white/10 bg-ink-900 px-2 py-1.5 text-xs text-white outline-none"
                >
                  <option>9:16</option>
                  <option>1:1</option>
                  <option>16:9</option>
                  <option>4:5</option>
                </select>
                <button className="btn-primary !px-4 !py-1.5 text-xs">Export</button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[200px_1fr_240px]">
              {/* Left tools */}
              <div className="hidden border-r border-white/[0.06] p-4 lg:block">
                {tools.map((t, i) => (
                  <button
                    key={t}
                    className={`mb-1 block w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      i === 0
                        ? "bg-brand/15 font-semibold text-brand-soft"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="flex flex-col items-center justify-center gap-4 bg-ink-900/50 p-6">
                <div
                  className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-ink-700 to-ink-900 transition-all duration-500 ${
                    ratio === "9:16"
                      ? "aspect-[9/16] w-40"
                      : ratio === "1:1"
                      ? "aspect-square w-56"
                      : ratio === "4:5"
                      ? "aspect-[4/5] w-48"
                      : "aspect-video w-full max-w-sm"
                  }`}
                >
                  <div className="absolute inset-x-3 bottom-4 rounded-lg bg-black/60 p-2 text-center">
                    <p className="text-[10px] font-bold text-white">
                      {mode === "ai"
                        ? "✦ AI is styling your captions…"
                        : "drag captions to reposition"}
                    </p>
                  </div>
                </div>
                {/* Timeline */}
                <div className="w-full">
                  <div className="flex gap-1">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-8 flex-1 rounded ${
                          i >= 3 && i <= 8 ? "bg-brand/40 ring-1 ring-brand/60" : "bg-ink-700"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className={`h-3 flex-1 rounded-sm ${i % 3 === 0 ? "bg-accent/30" : "bg-ink-800"}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className="hidden border-l border-white/[0.06] p-4 xl:block lg:block">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  {mode === "ai" ? "AI Suggestions" : "Caption style"}
                </p>
                {(mode === "ai"
                  ? ["Punch-in at 00:12", "Add B-Roll: city timelapse", "Boost dialog audio +3dB", "Trim silence 00:41–00:44"]
                  : ["Bold pop", "Karaoke", "Minimal", "Neon glow"]
                ).map((s) => (
                  <div
                    key={s}
                    className="mb-2 cursor-pointer rounded-xl border border-white/[0.06] bg-ink-900 px-3 py-2.5 text-xs text-zinc-300 transition hover:border-brand/40 hover:text-white"
                  >
                    {mode === "ai" ? "✦ " : ""}{s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
