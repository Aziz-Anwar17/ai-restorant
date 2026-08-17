import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to see your project history." },
      { status: 401 }
    );
  }
  const jobs = getDb()
    .prepare(
      `SELECT j.id, j.status, j.progress, j.total_clips, j.completed_clips, j.created_at,
              v.original_name AS video_name, v.duration_sec
       FROM processing_jobs j JOIN videos v ON v.id = j.video_id
       WHERE j.user_id = ?
       ORDER BY j.created_at DESC LIMIT 50`
    )
    .all(user.uid);
  return NextResponse.json({ projects: jobs });
}
