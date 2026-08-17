"use client";

import { useState } from "react";
import { authClient, authEnabled } from "@/lib/firebaseClient";
import { useAuth } from "./AuthProvider";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const friendly = (e: unknown): string => {
    const code = (e as { code?: string })?.code ?? "";
    if (code.includes("invalid-credential") || code.includes("wrong-password"))
      return "Email or password is incorrect.";
    if (code.includes("email-already-in-use"))
      return "That email is already registered. Try signing in.";
    if (code.includes("weak-password"))
      return "Password must be at least 6 characters.";
    if (code.includes("invalid-email")) return "Please enter a valid email.";
    if (code.includes("popup-closed")) return "Sign-in was cancelled.";
    if (code.includes("operation-not-allowed") || code.includes("configuration-not-found"))
      return "This sign-in method isn't enabled yet on the server.";
    return e instanceof Error ? e.message : "Something went wrong. Try again.";
  };

  const doGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await authClient.signInGoogle();
      await refreshProfile();
      onClose();
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const doEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await authClient.signUpEmail(email, password);
      else await authClient.signInEmail(email, password);
      await refreshProfile();
      onClose();
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card w-full max-w-sm rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {mode === "signup"
                ? "Get 90 free credits 🎁 — no credit card required"
                : "Sign in to your AI Restorant account"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        {!authEnabled ? (
          <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
            Authentication isn&apos;t configured on this deployment yet. You can
            still generate clips without an account.
          </p>
        ) : (
          <>
            <button
              onClick={doGoogle}
              disabled={busy}
              className="btn-secondary mt-5 w-full disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 01-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.4 7.4 0 01-11-3.9H1v3.1A12 12 0 0012 24z" />
                <path fill="#FBBC05" d="M5 14.2a7.2 7.2 0 010-4.4V6.7H1a12 12 0 000 10.6l4-3.1z" />
                <path fill="#EA4335" d="M12 4.7c1.8 0 3.4.6 4.6 1.8L20.1 3A12 12 0 001 6.7l4 3.1A7.4 7.4 0 0112 4.7z" />
              </svg>
              Continue with Google
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={doEmail} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand/50"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand/50"
              />
              <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                {busy ? "Working…" : mode === "signup" ? "Sign up – It's FREE" : "Sign in"}
              </button>
            </form>

            {error && (
              <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-xs text-zinc-500">
              {mode === "signup" ? "Already have an account? " : "New to AI Restorant? "}
              <button
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="font-semibold text-brand-soft hover:underline"
              >
                {mode === "signup" ? "Sign in" : "Create account"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
