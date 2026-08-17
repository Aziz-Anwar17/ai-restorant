import { NextResponse } from "next/server";
import { youtubeConfigured, getChannelInfo } from "@/lib/social/youtube";

export const runtime = "nodejs";

const OTHERS = ["tiktok", "instagram_reels", "facebook", "linkedin", "x"];

export async function GET() {
  let youtube: { available: boolean; channel?: string; error?: string } = {
    available: false,
  };
  if (youtubeConfigured()) {
    try {
      const ch = await getChannelInfo();
      youtube = { available: true, channel: ch.title };
    } catch (e) {
      youtube = {
        available: false,
        error: e instanceof Error ? e.message : "verification failed",
      };
    }
  }
  return NextResponse.json({
    platforms: {
      youtube_shorts: youtube,
      ...Object.fromEntries(
        OTHERS.map((p) => [p, { available: false, comingSoon: true }])
      ),
    },
  });
}
