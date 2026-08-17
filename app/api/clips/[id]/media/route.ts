import { NextRequest } from "next/server";
import fs from "fs";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clip = getDb()
    .prepare("SELECT file_path FROM clips WHERE id=?")
    .get(params.id) as { file_path: string } | undefined;
  if (!clip?.file_path || !fs.existsSync(clip.file_path)) {
    return new Response("Not found", { status: 404 });
  }

  const stat = fs.statSync(clip.file_path);
  const range = req.headers.get("range");

  if (range) {
    const m = range.match(/bytes=(\d+)-(\d*)/);
    const start = m ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    const stream = fs.createReadStream(clip.file_path, { start, end });
    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1),
        "Content-Type": "video/mp4",
      },
    });
  }

  const stream = fs.createReadStream(clip.file_path);
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Length": String(stat.size),
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    },
  });
}
