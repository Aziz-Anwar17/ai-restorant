"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth, authedFetch } from "@/components/AuthProvider";

type Project = {
  id: string;
  status: string;
  progress: number;
  total_clips: number;
  completed_clips: number;
  created_at: string;
  video_name: string;
  duration_sec: number | null;
};

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    authedFetch("/api/projects")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setProjects(d.projects);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."));
  }, [user]);

  return (
    <main>
      <Navbar />
      <section className="mx-auto min-h-[70vh] max-w-4xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="text-3xl font-extrabold text-white">My Projects</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Every video you&apos;ve processed while signed in.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-zinc-500">Loading…</p>
        ) : !user ? (
          <div className="card mt-10 rounded-3xl p-8 text-center">
            <p className="text-sm text-zinc-400">
              Sign in to see your project history.
            </p>
            <a href="/" className="btn-primary mt-4 inline-flex">
              Back to home
            </a>
          </div>
        ) : error ? (
          <p className="mt-10 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : projects === null ? (
          <p className="mt-10 text-sm text-zinc-500">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="card mt-10 rounded-3xl p-8 text-center">
            <p className="text-sm text-zinc-400">
              No projects yet. Generate your first clips!
            </p>
            <a href="/#upload" className="btn-primary mt-4 inline-flex">
              Upload a video
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="card flex flex-col gap-2 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {p.video_name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {new Date(p.created_at).toLocaleString()} ·{" "}
                    {p.completed_clips}/{p.total_clips} clips
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    p.status === "completed"
                      ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : p.status === "failed"
                      ? "border border-red-400/30 bg-red-400/10 text-red-300"
                      : "border border-brand/30 bg-brand/10 text-brand-soft"
                  }`}
                >
                  {p.status === "completed"
                    ? "Completed"
                    : p.status === "failed"
                    ? "Failed"
                    : `Processing ${p.progress}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
