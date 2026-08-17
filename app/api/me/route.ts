import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Auth is Phase 2 (Firebase Auth). This endpoint honestly reports the
 * anonymous state instead of pretending a user is logged in.
 */
export async function GET() {
  return NextResponse.json({
    authenticated: false,
    user: null,
    authProvider: "none",
    note: "Authentication is not enabled yet. Firebase Auth is planned for Phase 2.",
  });
}
