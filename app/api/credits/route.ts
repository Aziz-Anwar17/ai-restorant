import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getUserFromRequest, authConfigured } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const base = {
    enabled: authConfigured(),
    creditsPerClip: config.creditsPerClip,
    freeCreditsOnSignup: config.freeCredits,
  };
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ ...base, authenticated: false });

  const transactions = getDb()
    .prepare(
      "SELECT amount, reason, job_id, created_at FROM credit_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 20"
    )
    .all(user.uid);

  return NextResponse.json({
    ...base,
    authenticated: true,
    credits: user.credits,
    transactions,
  });
}
