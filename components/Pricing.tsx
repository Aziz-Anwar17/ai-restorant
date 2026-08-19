import Reveal from "./Reveal";

const tiers = [
  {
    name: "Free",
    price: "$0",
    tagline: "90 credits to start — no credit card",
    features: [
      "90 free credits (1 credit = 1 clip)",
      "AI clip selection with virality scores",
      "9:16 auto-reframe + burned-in captions",
      "Preview & MP4 / ZIP downloads",
    ],
    cta: { label: "Get free clips", href: "#upload", primary: true },
  },
  {
    name: "Creator",
    price: "Coming soon",
    tagline: "More credits + advanced editing",
    features: [
      "Larger monthly credit packs",
      "AI Editor with caption styles",
      "Publish & schedule to YouTube Shorts",
      "Priority processing",
    ],
    cta: { label: "Join the waitlist", href: "mailto:azizanwar1726@gmail.com?subject=AI%20Restorant%20Creator%20waitlist", primary: false },
  },
  {
    name: "Pro",
    price: "Coming soon",
    tagline: "High-volume AI video creation",
    features: [
      "Highest credit allocation",
      "API access & workflow automation",
      "Multi-platform publishing",
      "Team workspaces",
    ],
    cta: { label: "Contact us", href: "mailto:azizanwar1726@gmail.com?subject=AI%20Restorant%20Pro", primary: false },
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="eyebrow mb-4">Pricing</p>
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
            Every new account gets 90 free credits. Paid plans are in the works
            — pricing below is indicative and payments aren&apos;t live yet.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div
                className={`card card-hover flex h-full flex-col rounded-3xl p-7 ${
                  i === 0 ? "border-brand/40 shadow-[0_0_50px_-15px_rgba(124,92,255,0.4)]" : ""
                }`}
              >
                {i === 0 && (
                  <span className="mb-3 w-fit rounded-full bg-gradient-to-r from-brand to-accent px-3 py-1 text-[10px] font-bold text-white">
                    AVAILABLE NOW
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{t.name}</h3>
                <p className="mt-1 text-2xl font-extrabold text-white">{t.price}</p>
                <p className="mt-1 text-xs text-zinc-500">{t.tagline}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-zinc-400">
                      <span className="text-accent">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={t.cta.href}
                  className={`${t.cta.primary ? "btn-primary" : "btn-secondary"} mt-6 w-full`}
                >
                  {t.cta.label}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
