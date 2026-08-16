"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";

export default function CTA() {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Big CTA section */}
      <section id="cta" className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="card relative overflow-hidden rounded-3.5xl p-10 text-center sm:p-16">
              <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-brand/25 blur-[100px]" aria-hidden="true" />
              <h2 className="relative text-3xl font-extrabold text-white sm:text-4xl">
                Get 90 Credits for Free 🎁
              </h2>
              <p className="relative mt-3 text-zinc-400">No credit card required</p>
              <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href="#hero-upload" className="btn-primary">Get free clips</a>
                <a href="#ai-models" className="btn-secondary">See demos</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sticky bottom CTA */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="border-t border-white/[0.08] bg-ink-950/90 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Get 90 Credits for Free 🎁
              </p>
              <p className="text-xs text-zinc-500">No credit card required</p>
            </div>
            <a href="#hero-upload" className="btn-primary shrink-0 !px-5 !py-2.5 text-xs sm:text-sm">
              Get free clips
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
