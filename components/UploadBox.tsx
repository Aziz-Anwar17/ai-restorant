"use client";

import { useState } from "react";

export default function UploadBox() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div id="hero-upload" className="mx-auto w-full max-w-2xl">
      <form
        className="card flex items-center gap-3 rounded-3.5xl p-2.5 pl-5 shadow-[0_0_60px_-15px_rgba(124,92,255,0.4)]"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <svg
          className="h-5 w-5 shrink-0 text-brand-soft"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Drop a long video"
          aria-label="Paste a video link"
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white placeholder-zinc-500 outline-none sm:text-base"
        />
        <button type="submit" className="btn-primary shrink-0 !px-5">
          Get free clips
        </button>
      </form>
      {submitted && (
        <p className="mt-3 text-sm text-accent">
          ✓ Great — sign up free to start clipping this video.
        </p>
      )}
      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href="#ai-models" className="btn-secondary w-full sm:w-auto">
          See demos
        </a>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500">
        Or upload videos after signing up
      </p>
    </div>
  );
}
