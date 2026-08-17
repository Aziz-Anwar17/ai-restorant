import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createJob } from "@/lib/jobs";
import { config } from "@/lib/config";
import { getUserFromRequest, deductCredits } from "@/lib/auth";

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

  // Signed-in users spend credits (deducted up front, failed clips refunded
  // on completion). Anonymous users may still try the product — Phase 2 keeps
  // login out of the critical path per the UX priorities.
  const user = await getUserFromRequest(req);
  const cost = clipCount * config.creditsPerClip;

  // Deduct BEFORE enqueueing so an unpaid job never starts running.
  const ref = `pre_${Date.now().toString(36)}`;
  if (user && !deductCredits(user.uid, cost, ref)) {
    return NextResponse.json(
      { error: `Not enough credits: this run needs ${cost}, you have ${user.credits}.` },
      { status: 402 }
    );
  }

  const jobId = createJob(String(body.videoId), clipCount, user?.uid ?? null);
  if (user) {
    getDb()
      .prepare("UPDATE credit_transactions SET job_id=? WHERE job_id=?")
      .run(jobId, ref);
  }

  return NextResponse.json({ jobId, cost: user ? cost : 0 }, { status: 201 });
}
