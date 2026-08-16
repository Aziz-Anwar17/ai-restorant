const clips = [
  { title: "The #1 mistake creators make", score: 98, tag: "Hook" },
  { title: "Why nobody tells you this", score: 94, tag: "Story" },
  { title: "3 tools that changed my life", score: 91, tag: "List" },
  { title: "This took me 5 years to learn", score: 87, tag: "Insight" },
];

const platforms = [
  { name: "YouTube", color: "#ff4444", d: "M10 15l5.19-3L10 9v6zm11.5-3s0-3.2-.4-4.6a2.5 2.5 0 00-1.8-1.8C17.9 5.2 12 5.2 12 5.2s-5.9 0-7.3.4a2.5 2.5 0 00-1.8 1.8C2.5 8.8 2.5 12 2.5 12s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.4.4 7.3.4 7.3.4s5.9 0 7.3-.4a2.5 2.5 0 001.8-1.8c.4-1.4.4-4.6.4-4.6z" },
  { name: "TikTok", color: "#e2e8f0", d: "M16.6 5.8a4.8 4.8 0 01-1.1-3.1H12v13.4a2.9 2.9 0 11-2-2.7V9.9a6.3 6.3 0 106.6 6.3V9.4a8 8 0 004.7 1.5V7.4a4.8 4.8 0 01-4.7-1.6z" },
  { name: "Instagram", color: "#e1559e", d: "M12 2.2c3.2 0 3.6 0 4.9.1 3.2.1 4.7 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.7-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.2-.1-4.7-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 3.6a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 2.2a4 4 0 110 8 4 4 0 010-8zm6.4-3.7a1.4 1.4 0 100 2.9 1.4 1.4 0 000-2.9z" },
  { name: "LinkedIn", color: "#4a9fdc", d: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.2V9h3.4v1.6h.1a3.8 3.8 0 013.4-1.9c3.6 0 4.3 2.4 4.3 5.5v6.3zM5.3 7.4a2.1 2.1 0 110-4.1 2.1 2.1 0 010 4.1zM7.1 20.5H3.5V9h3.6v11.5z" },
  { name: "Facebook", color: "#5b8def", d: "M24 12a12 12 0 10-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z" },
  { name: "X", color: "#cbd5e1", d: "M18.2 2.3h3.3l-7.2 8.2 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.7-8.8L1.2 2.3H8l4.7 6.2 5.5-6.2z" },
];

export default function ProductPreview() {
  return (
    <div className="card mx-auto mt-16 max-w-5xl overflow-hidden rounded-3.5xl p-4 sm:p-6">
      {/* window chrome */}
      <div className="mb-5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-zinc-500">app.dapur.ai / projects / podcast-ep-42</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* long video side */}
        <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-ink-900 p-4">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                <svg className="ml-1 h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">1:24:36</span>
            <span className="absolute left-2 top-2 rounded bg-brand/80 px-2 py-0.5 text-[10px] font-semibold text-white">LONG VIDEO</span>
          </div>
          <p className="mt-3 truncate text-sm font-semibold text-white">
            Podcast Ep. 42 — Building a creator business in 2026
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-white/5">
            <div className="h-full w-2/3 rounded bg-gradient-to-r from-brand to-accent" />
          </div>
          <button className="btn-primary mt-4 w-full !py-2.5 text-sm">
            ✦ Get clips
          </button>
        </div>

        {/* clips side */}
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            10 clips generated · 9:16
          </p>
          {clips.map((c) => (
            <div
              key={c.title}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-ink-900 p-3 transition hover:border-brand/40"
            >
              <div className="relative h-16 w-9 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-brand/40 to-ink-700">
                <span className="absolute inset-x-0 bottom-1 text-center text-[7px] font-bold text-white/90">9:16</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{c.title}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{c.tag} · auto-captioned</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-accent">{c.score}</p>
                <p className="text-[10px] text-zinc-500">virality</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* platforms */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-5 border-t border-white/[0.06] pt-5">
        <span className="text-xs text-zinc-500">Publish everywhere:</span>
        {platforms.map((p) => (
          <svg key={p.name} className="h-5 w-5 opacity-80 transition hover:opacity-100" viewBox="0 0 24 24" aria-label={p.name}>
            <path d={p.d} fill={p.color} />
          </svg>
        ))}
      </div>
    </div>
  );
}
