import Reveal from "./Reveal";
import WorkflowStep from "./WorkflowStep";

function Arrow() {
  return (
    <div className="flex items-center justify-center py-2 lg:py-0" aria-hidden="true">
      <svg
        className="h-6 w-6 rotate-90 text-brand-soft lg:rotate-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M5 12h14m-6-6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function WorkflowAutomation() {
  return (
    <section id="automation" className="relative py-24">
      <div className="pointer-events-none absolute left-0 top-1/3 h-[300px] w-[400px] rounded-full bg-brand/10 blur-[130px]" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="eyebrow mb-4">↻ Workflow Automation</p>
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Your video creation process — now on autopilot
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
            Create and publish videos 5x faster with Dapur AI&apos;s web app and
            API, so you can go on vacation and still keep your content rolling.
          </p>
        </Reveal>

        <div className="mt-14 flex flex-col lg:flex-row lg:items-stretch lg:gap-0">
          <WorkflowStep
            step="01"
            title="Auto import"
            description="Automatically pulls the latest videos from your YouTube or the cloud, so you never miss a moment to clip and share."
            visual={
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8" viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6zm11.5-3s0-3.2-.4-4.6a2.5 2.5 0 00-1.8-1.8C17.9 5.2 12 5.2 12 5.2s-5.9 0-7.3.4a2.5 2.5 0 00-1.8 1.8C2.5 8.8 2.5 12 2.5 12s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.4.4 7.3.4 7.3.4s5.9 0 7.3-.4a2.5 2.5 0 001.8-1.8c.4-1.4.4-4.6.4-4.6z" fill="#ff4444"/></svg>
                <div className="h-12 w-20 rounded-lg bg-gradient-to-br from-ink-700 to-ink-800" />
                <svg className="h-6 w-6 animate-spin text-accent" style={{ animationDuration: "3s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-3-6.7M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-zinc-500">synced</span>
              </div>
            }
          />
          <Arrow />
          <WorkflowStep
            step="02"
            delay={120}
            title="Auto editing"
            description="Our AI automatically clips, captions, reframes, adds B-Roll, and enhances audio, so your videos are ready to post with no extra editing."
            visual={
              <div className="flex items-center gap-3">
                <div className="h-12 w-20 rounded-lg bg-ink-700 opacity-60" />
                <span className="text-brand-soft">✦</span>
                <div className="relative h-16 w-9 rounded-lg bg-gradient-to-b from-brand/50 to-accent/30 ring-1 ring-brand/50">
                  <span className="absolute inset-x-0 bottom-1 text-center text-[6px] font-bold text-white">CAPTIONS</span>
                </div>
                <div className="text-[10px] leading-relaxed text-zinc-500">
                  ✓ clipped<br />✓ captioned<br />✓ reframed
                </div>
              </div>
            }
          />
          <Arrow />
          <WorkflowStep
            step="03"
            delay={240}
            title="Auto scheduling"
            description="Automatically schedules your videos across platforms, so you stay consistent and be everywhere without lifting a finger."
            visual={
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-4 gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className={`h-3.5 w-3.5 rounded-sm ${i === 2 || i === 5 ? "bg-brand" : "bg-ink-700"}`} />
                  ))}
                </div>
                <div className="text-xs text-zinc-400">
                  <p className="font-semibold text-white">Tue · 6:00 PM</p>
                  <p className="text-[10px] text-zinc-500">YouTube · TikTok · IG · X</p>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
