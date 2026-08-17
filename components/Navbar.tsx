"use client";

import { useState } from "react";
import Logo from "./Logo";
import AuthModal from "./AuthModal";
import { useAuth } from "./AuthProvider";

const links = [
  { label: "AI Models", href: "/#ai-models" },
  { label: "Automation", href: "/#automation" },
  { label: "AI Editor", href: "/#ai-editor" },
  { label: "Pricing", href: "/#cta" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { enabled, user, profile, signOut } = useAuth();

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

        <a href="/" className="flex items-center">
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

        {user ? (
          <div className="relative flex items-center gap-3">
            {profile && (
              <span className="hidden rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-soft sm:inline">
                {profile.credits} credits
              </span>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-bold text-white"
              aria-label="Account menu"
            >
              {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 bg-ink-900 p-2 shadow-xl">
                <p className="truncate px-3 py-1.5 text-xs text-zinc-500">
                  {user.email}
                </p>
                {profile && (
                  <p className="px-3 py-1 text-xs text-brand-soft sm:hidden">
                    {profile.credits} credits
                  </p>
                )}
                <a
                  href="/projects"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  My Projects
                </a>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => (enabled ? setAuthOpen(true) : null)}
            {...(!enabled ? { title: "Auth not configured — try it free below" } : {})}
            className="btn-primary !px-4 !py-2 text-xs sm:text-sm sm:!px-5"
          >
            Sign up – It&apos;s FREE
          </button>
        )}
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

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </header>
  );
}
