import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getDb, genId, now } from "@/lib/db";
import { validateYouTubeUrl, fetchYouTubeMeta } from "@/lib/pipeline/youtube";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let url: URL;
  try {
    url = validateYouTubeUrl(String(body.url ?? ""));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid URL." },
      { status: 400 }
    );
  }

  try {
    const meta = await fetchYouTubeMeta(url.toString());
    if (meta.durationSec > config.maxVideoDurationMin * 60) {
      return NextResponse.json(
        { error: `Video is too long. Max duration is ${config.maxVideoDurationMin} minutes.` },
        { status: 400 }
      );
    }
    const videoId = genId("video");
    getDb()
      .prepare(
        `INSERT INTO videos (id, user_id, source, source_url, original_name, file_path, duration_sec, width, height, size_bytes, created_at)
         VALUES (?, NULL, 'youtube', ?, ?, NULL, ?, NULL, NULL, NULL, ?)`
      )
      .run(videoId, url.toString(), meta.title, meta.durationSec, now());

    return NextResponse.json({
      video: {
        id: videoId,
        name: meta.title,
        durationSec: meta.durationSec,
        source: "youtube",
      },
    });
  } catch (err) {
    console.error("[from-youtube] error:", err);
    return NextResponse.json(
      { error: "We couldn't read that YouTube video. Please check the link and try again." },
      { status: 502 }
    );
  }
}
