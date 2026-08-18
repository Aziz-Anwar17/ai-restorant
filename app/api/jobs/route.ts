import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createJob } from "@/lib/jobs";
import { config } from "@/lib/config";
import { getUserFromRequest, deductCredits } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_CLIP_COUNTS = [3, 5, 10];
const ANON_JOBS_PER_DAY = 1;

/** Client IP: first hop of x-forwarded-for (set by Caddy) or x-real-ip. */
function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Atomically count an anonymous job for this IP today; false = over limit. */
function takeAnonSlot(ip: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO anon_usage (ip, day, jobs) VALUES (?, ?, 0)"
  ).run(ip, day);
  const result = db
    .prepare("UPDATE anon_usage SET jobs = jobs + 1 WHERE ip=? AND day=? AND jobs < ?")
    .run(ip, day, ANON_JOBS_PER_DAY);
  return result.changes > 0;
}

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

  // Anonymous trial is capped per IP per day — processing burns real
  // Anthropic + CPU cost, so unlimited anonymous runs invite abuse.
  if (!user && !takeAnonSlot(clientIp(req))) {
    return NextResponse.json(
      {
        error:
          "You've used today's free try. Sign up (free, 90 credits) to keep going.",
        requiresAuth: true,
      },
      { status: 429 }
    );
  }

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
