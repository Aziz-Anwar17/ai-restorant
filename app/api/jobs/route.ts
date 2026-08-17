import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createJob } from "@/lib/jobs";

export const runtime = "nodejs";

const ALLOWED_CLIP_COUNTS = [3, 5, 10];

export async function POST(req: NextRequest) {
  let body: { videoId?: string; clipCount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const clipCount = ALLOWED_CLIP_COUNTS.includes(Number(body.clipCount))
    ? Number(body.clipCount)
    : 10;

  const video = getDb()
    .prepare("SELECT id FROM videos WHERE id=?")
    .get(String(body.videoId ?? ""));
  if (!video) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  const jobId = createJob(String(body.videoId), clipCount);
  return NextResponse.json({ jobId }, { status: 201 });
}
