import { NextResponse } from "next/server";
import { getUserFromRequest, authConfigured } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      authProvider: "none",
      note: "Authentication is not configured (FIREBASE_PROJECT_ID missing).",
    });
  }
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null, authProvider: "firebase" });
  }
  return NextResponse.json({
    authenticated: true,
    authProvider: "firebase",
    user,
  });
}
