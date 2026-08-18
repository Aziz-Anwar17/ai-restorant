import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recoverOrphanedJobs } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  recoverOrphanedJobs();
  const job = db
    .prepare("SELECT * FROM processing_jobs WHERE id=?")
    .get(params.id) as
    | {
        id: string;
        status: string;
        progress: number;
        total_clips: number;
        completed_clips: number;
        error: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const clips =
    job.status === "completed"
      ? (
          db
            .prepare("SELECT * FROM clips WHERE job_id=? ORDER BY idx")
            .all(params.id) as {
            id: string;
            idx: number;
            title: string;
            start_sec: number;
            end_sec: number;
            score: number;
            reason: string;
            hook: string;
            caption: string;
            platforms: string;
          }[]
        ).map((c) => ({
          id: c.id,
          index: c.idx,
          title: c.title,
          startSec: c.start_sec,
          endSec: c.end_sec,
          score: c.score,
          reason: c.reason,
          hook: c.hook,
          caption: c.caption,
          platforms: JSON.parse(c.platforms ?? "[]") as string[],
          mediaUrl: `/api/clips/${c.id}/media`,
          thumbUrl: `/api/clips/${c.id}/thumb`,
          downloadUrl: `/api/clips/${c.id}/download`,
        }))
      : [];

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      totalClips: job.total_clips,
      completedClips: job.completed_clips,
      error: job.error,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    },
    clips,
  });
}
