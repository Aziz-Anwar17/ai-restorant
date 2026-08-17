import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getDb, genId, now } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { youtubeConfigured, uploadShort } from "@/lib/social/youtube";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to publish clips." },
      { status: 401 }
    );
  }

  let body: {
    clipId?: string;
    platform?: string;
    title?: string;
    caption?: string;
    privacy?: "private" | "unlisted" | "public";
    publishAt?: string;
    timezone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.platform !== "youtube_shorts") {
    return NextResponse.json(
      { error: "This platform isn't connected yet — YouTube Shorts is available now, others are coming soon." },
      { status: 400 }
    );
  }
  if (!youtubeConfigured()) {
    return NextResponse.json(
      { error: "YouTube isn't configured on this server (YOUTUBE_* env missing)." },
      { status: 503 }
    );
  }

  const clip = getDb()
    .prepare("SELECT id, title, caption, file_path FROM clips WHERE id=?")
    .get(String(body.clipId ?? "")) as
    | { id: string; title: string; caption: string; file_path: string }
    | undefined;
  if (!clip?.file_path || !fs.existsSync(clip.file_path)) {
    return NextResponse.json({ error: "Clip not found." }, { status: 404 });
  }

  const publishAt = body.publishAt ? new Date(body.publishAt) : null;
  if (publishAt && (isNaN(publishAt.getTime()) || publishAt <= new Date())) {
    return NextResponse.json(
      { error: "Publish time must be a valid future date." },
      { status: 400 }
    );
  }

  const postId = genId("post");
  const db = getDb();
  db.prepare(
    `INSERT INTO scheduled_posts (id, user_id, clip_id, platform, caption, publish_at, timezone, status, created_at)
     VALUES (?, ?, ?, 'youtube_shorts', ?, ?, ?, 'publishing', ?)`
  ).run(
    postId,
    user.uid,
    clip.id,
    body.caption ?? clip.caption,
    publishAt?.toISOString() ?? null,
    body.timezone ?? "UTC",
    now()
  );

  try {
    const result = await uploadShort({
      filePath: clip.file_path,
      title: (body.title ?? clip.title).slice(0, 100),
      description: body.caption ?? clip.caption ?? "",
      privacy: body.privacy ?? "public",
      publishAt: publishAt?.toISOString(),
    });
    db.prepare("UPDATE scheduled_posts SET status=?, caption=? WHERE id=?").run(
      publishAt ? "scheduled" : "published",
      `${body.caption ?? clip.caption}\n${result.url}`,
      postId
    );
    return NextResponse.json({
      status: publishAt ? "scheduled" : "published",
      url: result.url,
      videoId: result.videoId,
      ...(publishAt ? { publishAt: publishAt.toISOString() } : {}),
    });
  } catch (e) {
    console.error("[social/publish] error:", e);
    db.prepare("UPDATE scheduled_posts SET status='failed' WHERE id=?").run(postId);
    return NextResponse.json(
      { error: "Publishing to YouTube failed. Please try again." },
      { status: 502 }
    );
  }
}
