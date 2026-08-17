"use client";

import { useState } from "react";
import Logo from "./Logo";

const links = [
  { label: "AI Models", href: "#ai-models" },
  { label: "Automation", href: "#automation" },
  { label: "AI Editor", href: "#ai-editor" },
  { label: "Pricing", href: "#cta" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Mobile hamburger (left) */}
        <button
          className="mr-2 rounded-lg p-2 text-white md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <a href="#" className="flex items-center">
          <Logo />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a href="#upload" className="btn-primary !px-4 !py-2 text-xs sm:text-sm sm:!px-5">
          Sign up – It&apos;s FREE
        </a>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] bg-ink-950/95 px-6 py-4 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-medium text-zinc-300 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
