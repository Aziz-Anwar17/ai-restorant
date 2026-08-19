import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { config } from "@/lib/config";
import { getDb, genId, now } from "@/lib/db";
import { storagePaths } from "@/lib/storage";
import { probeVideo } from "@/lib/pipeline/probe";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // Serving-only deployments (no ffmpeg/ffprobe) can't process uploads.
    if (!fs.existsSync("/usr/bin/ffprobe") && !process.env.FFPROBE_BIN && !fs.existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffprobe")) {
      return NextResponse.json(
        { error: "Video processing is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (
      !config.allowedVideoExtensions.includes(ext) &&
      !config.allowedVideoTypes.includes(file.type)
    ) {
      return NextResponse.json(
        { error: "Unsupported format. Please upload MP4, MOV, WebM, or M4V." },
        { status: 400 }
      );
    }
    if (file.size > config.maxVideoSizeMb * 1024 * 1024) {
      return NextResponse.json(
        { error: `File is too large. Max size is ${config.maxVideoSizeMb} MB.` },
        { status: 400 }
      );
    }

    const videoId = genId("video");
    const destPath = path.join(
      storagePaths.uploads(),
      `${videoId}${ext || ".mp4"}`
    );
    // Stream ke disk — jangan buffer file (hingga 2GB) ke RAM
    await pipeline(
      Readable.fromWeb(file.stream() as import("stream/web").ReadableStream),
      fs.createWriteStream(destPath)
    );

    let info;
    try {
      info = await probeVideo(destPath);
    } catch {
      fs.rmSync(destPath, { force: true });
      return NextResponse.json(
        { error: "We couldn't read this video file. It may be corrupted." },
        { status: 400 }
      );
    }
    if (info.durationSec > config.maxVideoDurationMin * 60) {
      fs.rmSync(destPath, { force: true });
      return NextResponse.json(
        { error: `Video is too long. Max duration is ${config.maxVideoDurationMin} minutes.` },
        { status: 400 }
      );
    }

    getDb()
      .prepare(
        `INSERT INTO videos (id, user_id, source, source_url, original_name, file_path, duration_sec, width, height, size_bytes, created_at)
         VALUES (?, ?, 'upload', NULL, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        videoId,
        (await getUserFromRequest(req))?.uid ?? null,
        file.name,
        destPath,
        info.durationSec,
        info.width,
        info.height,
        file.size,
        now()
      );

    return NextResponse.json({
      video: {
        id: videoId,
        name: file.name,
        durationSec: info.durationSec,
        width: info.width,
        height: info.height,
        sizeBytes: file.size,
        source: "upload",
      },
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json(
      { error: "We couldn't upload your video. Please try again." },
      { status: 500 }
    );
  }
}
