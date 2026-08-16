import Logo from "./Logo";

const columns = [
  {
    title: "Product",
    links: ["AI Clipping", "AI Editor", "ClipAnything", "Auto Captions", "Workflow Automation"],
  },
  { title: "Resources", links: ["Documentation", "API", "Help Center", "Blog"] },
  { title: "Company", links: ["About", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms"] },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950 pb-24 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-zinc-500">
              AI-powered video creation platform.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-semibold text-white">{col.title}</p>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="mb-2.5 block text-sm text-zinc-500 transition hover:text-white"
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/[0.06] pt-6">
          <p className="text-xs text-zinc-600">
            © 2026 AI Restorant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
