import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "nodejs";

/**
 * Credit system is Phase 2. Configuration is real (env-driven); per-user
 * balances require authentication first.
 */
export async function GET() {
  return NextResponse.json({
    enabled: false,
    creditsPerClip: config.creditsPerClip,
    freeCreditsOnSignup: config.freeCredits,
    note: "Credit tracking activates with authentication in Phase 2.",
  });
}
