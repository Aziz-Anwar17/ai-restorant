import Reveal from "./Reveal";

export default function WorkflowStep({
  step,
  title,
  description,
  visual,
  delay = 0,
}: {
  step: string;
  title: string;
  description: string;
  visual: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className="flex-1">
      <div className="card card-hover flex h-full flex-col rounded-3xl p-6">
        <p className="text-xs font-bold tracking-[0.25em] text-brand-soft">
          STEP {step}
        </p>
        <h3 className="mt-3 text-xl font-bold text-white">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-ink-900 p-4">
          {visual}
        </div>
      </div>
    </Reveal>
  );
}
