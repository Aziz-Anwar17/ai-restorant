"use client";

import { useEffect, useState } from "react";
import { authedFetch, useAuth } from "./AuthProvider";
import type { Clip } from "./ClipResults";

type Accounts = Record<
  string,
  { available: boolean; channel?: string; comingSoon?: boolean; error?: string }
>;

const PLATFORMS: { key: string; label: string }[] = [
  { key: "youtube_shorts", label: "YouTube Shorts" },
  { key: "tiktok", label: "TikTok" },
  { key: "instagram_reels", label: "Instagram Reels" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
];

const CAPTION_KEYS: Record<string, string> = {
  youtube_shorts: "youtube",
  tiktok: "tiktok",
  instagram_reels: "instagram",
  facebook: "instagram",
  linkedin: "linkedin",
  x: "x",
};

export default function PublishModal({
  clip,
  onClose,
}: {
  clip: Clip;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [platform, setPlatform] = useState("youtube_shorts");
  const [caption, setCaption] = useState(clip.caption);
  const [aiCaptions, setAiCaptions] = useState<Record<string, string> | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [when, setWhen] = useState<"now" | "schedule">("now");
  const [publishAt, setPublishAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ status: string; url?: string; publishAt?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/social/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.platforms))
      .catch(() => setAccounts({}));
  }, []);

  useEffect(() => {
    if (aiCaptions) {
      const key = CAPTION_KEYS[platform];
      if (aiCaptions[key]) setCaption(aiCaptions[key]);
    }
  }, [platform, aiCaptions]);

  const generateCaptions = async () => {
    setGenBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/clips/${clip.id}/social-captions`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setAiCaptions(d.captions);
      const key = CAPTION_KEYS[platform];
      if (d.captions[key]) setCaption(d.captions[key]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Caption generation failed.");
    } finally {
      setGenBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          platform,
          title: clip.title,
          caption,
          privacy: "public",
          ...(when === "schedule" && publishAt
            ? {
                publishAt: new Date(publishAt).toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }
            : {}),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setDone(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publishing failed.");
    } finally {
      setBusy(false);
    }
  };

  const selected = accounts?.[platform];
  const canPublish =
    Boolean(user) &&
    Boolean(selected?.available) &&
    (when === "now" || publishAt);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">Publish clip</h3>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{clip.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white">✕</button>
        </div>

        {done ? (
          <div className="mt-6 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 font-semibold text-white">
              {done.status === "scheduled" ? "Scheduled!" : "Published!"}
            </p>
            {done.publishAt && (
              <p className="mt-1 text-xs text-zinc-500">
                Goes live {new Date(done.publishAt).toLocaleString()}
              </p>
            )}
            {done.url && (
              <a href={done.url} target="_blank" rel="noreferrer" className="btn-primary mt-4 inline-flex text-sm">
                View on YouTube
              </a>
            )}
          </div>
        ) : (
          <>
            {/* platform picker */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => {
                const acc = accounts?.[p.key];
                const disabled = !acc?.available;
                return (
                  <button
                    key={p.key}
                    onClick={() => !disabled && setPlatform(p.key)}
                    disabled={disabled}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                      platform === p.key && !disabled
                        ? "border-brand bg-brand/15 text-white"
                        : disabled
                        ? "cursor-not-allowed border-white/[0.06] text-zinc-600"
                        : "border-white/10 text-zinc-300 hover:border-white/25"
                    }`}
                  >
                    {p.label}
                    {acc?.comingSoon && (
                      <span className="mt-0.5 block text-[10px] font-normal text-zinc-600">Coming soon</span>
                    )}
                    {p.key === "youtube_shorts" && acc?.channel && (
                      <span className="mt-0.5 block truncate text-[10px] font-normal text-emerald-400">✓ {acc.channel}</span>
                    )}
                    {p.key === "youtube_shorts" && accounts && !acc?.available && (
                      <span className="mt-0.5 block text-[10px] font-normal text-amber-400">Not configured</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* caption */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Caption</label>
                <div className="flex gap-2">
                  <button onClick={generateCaptions} disabled={genBusy} className="text-xs font-semibold text-brand-soft hover:underline disabled:opacity-50">
                    {genBusy ? "Generating…" : "✦ Generate Social Caption"}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(caption);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand/50"
              />
            </div>

            {/* timing */}
            <div className="mt-3 flex items-center gap-2">
              {(["now", "schedule"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWhen(w)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    when === w ? "bg-brand text-white" : "border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {w === "now" ? "Publish now" : "Schedule"}
                </button>
              ))}
              {when === "schedule" && (
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-white outline-none"
                />
              )}
            </div>

            {!user && (
              <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
                Sign in to publish clips.
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>
            )}

            <button
              onClick={publish}
              disabled={!canPublish || busy}
              className="btn-primary mt-5 w-full disabled:opacity-50"
            >
              {busy
                ? "Uploading…"
                : when === "schedule"
                ? "Schedule Post"
                : "Publish"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
