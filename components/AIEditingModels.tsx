import Reveal from "./Reveal";
import ClipAnything from "./ClipAnything";

const chips = ["Shower", "Airplane", "Surprise"];

export default function AIEditingModels() {
  return (
    <section id="ai-models" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="eyebrow mb-4">✦ AI Editing Models</p>
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            AI that understands every pixel of your video
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
            The most powerful AI editing models that work on any video. Built
            for speed, accuracy, and creative flexibility.
          </p>
        </Reveal>

        {/* Showcase card */}
        <Reveal delay={120}>
          <div className="card card-hover mx-auto mt-14 max-w-5xl rounded-3.5xl p-5 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div>
                {/* Prompt bar */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Prompt
                </p>
                <div className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-ink-900 px-4 py-3">
                  <span className="text-brand-soft">✦</span>
                  <p className="text-sm text-white">
                    Moment most likely to go viral on social media
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <button
                      key={c}
                      className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-brand/50 hover:text-white"
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Video preview + timeline */}
                <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-ink-700 to-ink-900">
                  <div className="absolute left-[38%] top-[12%] h-[76%] w-[26%] rounded-xl border-2 border-accent shadow-[0_0_25px_rgba(34,211,238,0.4)]">
                    <span className="absolute -top-6 left-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-ink-950">
                      AI selection
                    </span>
                  </div>
                  <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                    00:41:22
                  </span>
                </div>

                {/* Timeline frames */}
                <div className="mt-3 flex gap-1.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-10 flex-1 rounded-md ${
                        i >= 4 && i <= 6
                          ? "bg-gradient-to-b from-accent/60 to-brand/60 ring-1 ring-accent"
                          : "bg-ink-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Vertical preview */}
              <div className="flex items-center justify-center">
                <div className="relative aspect-[9/16] w-40 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-brand/30 via-ink-800 to-ink-900 sm:w-48">
                  <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white">
                    9:16 preview
                  </span>
                  <div className="absolute inset-x-3 bottom-6 rounded-lg bg-black/60 p-2 text-center">
                    <p className="text-[10px] font-bold leading-snug text-white">
                      &ldquo;this is the moment everything changed&rdquo;
                    </p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                    <div className="h-full w-1/2 bg-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <ClipAnything />
      </div>
    </section>
  );
}
