import Logo from "./Logo";

type FooterLink = {
  label: string;
  badge?: { text: string; style: "brand" | "hiring" };
};

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us" },
      { label: "Careers", badge: { text: "We're hiring!", style: "hiring" } },
      { label: "Contact Us" },
      { label: "Press & Media" },
    ],
  },
  {
    title: "Products & Solutions",
    links: [
      { label: "AI Clipping" },
      { label: "ClipAnything" },
      { label: "AI Editor" },
      { label: "Auto Captions & Reframe" },
      { label: "Workflow Automation" },
      { label: "Product Changelog" },
      { label: "Feature Request" },
      { label: "AI Restorant Free Trial", badge: { text: "Free", style: "brand" } },
      { label: "How AI Restorant Works" },
    ],
  },
  {
    title: "Resources & Support",
    links: [
      { label: "Case Studies & Customer Stories" },
      { label: "Creator Growth Blog" },
      { label: "Partner & Affiliate Program" },
      { label: "Brand & Media Assets" },
      { label: "Help Center / Support Portal" },
      { label: "Learning Center (Guides & Webinars)" },
      { label: "API & Developer Docs" },
    ],
  },
  {
    title: "Legal & Security",
    links: [
      { label: "Privacy Policy" },
      { label: "Terms of Service" },
      { label: "Data Security & Compliance" },
      { label: "Cookie Preferences" },
    ],
  },
];

const trustBadges = ["SOC 2", "ISO 27001", "GDPR"];

function Badge({ text, style }: { text: string; style: "brand" | "hiring" }) {
  if (style === "hiring") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
        {text}
      </span>
    );
  }
  return (
    <span className="ml-2 rounded-full bg-gradient-to-r from-brand to-accent px-2 py-0.5 text-[10px] font-bold text-white">
      {text}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-ink-950 pb-28 pt-16">
      {/* subtle brand glow behind the brand column */}
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/10 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1.3fr_1fr]">
          {/* Brand column */}
          <div className="md:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              Turn one long video into dozens of viral clips — automatically.
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              Trusted by 500,000+ creators worldwide
            </p>

            {/* Newsletter */}
            <form className="glass mt-6 flex max-w-xs items-center gap-2 rounded-2xl p-1.5 pl-3">
              <input
                type="email"
                placeholder="Work email"
                aria-label="Email for newsletter"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white placeholder-zinc-500 outline-none"
              />
              <button
                type="submit"
                className="btn-primary shrink-0 !px-4 !py-2 text-xs"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-[11px] text-zinc-600">
              Get AI video & creator insights, monthly. No spam.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                {col.title}
              </p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label} className="mb-2.5">
                    <a
                      href="#"
                      className="text-sm leading-relaxed text-zinc-500 underline-offset-4 transition duration-150 hover:text-white hover:underline"
                    >
                      {l.label}
                      {l.badge && <Badge {...l.badge} />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-zinc-600">
            © 2026 AI Restorant. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {trustBadges.map((b) => (
              <span
                key={b}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-400"
              >
                {b}
              </span>
            ))}
            <select
              aria-label="Language"
              className="rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-[11px] text-zinc-400 outline-none"
              defaultValue="en"
            >
              <option value="en">🌐 English</option>
              <option value="id">🇮🇩 Bahasa Indonesia</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
