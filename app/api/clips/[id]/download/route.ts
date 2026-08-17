import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const clip = getDb()
    .prepare("SELECT file_path FROM clips WHERE id=?")
    .get(params.id) as { file_path: string } | undefined;
  if (!clip?.file_path || !fs.existsSync(clip.file_path)) {
    return new Response("Not found", { status: 404 });
  }
  const stat = fs.statSync(clip.file_path);
  const stream = fs.createReadStream(clip.file_path);
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${path.basename(clip.file_path)}"`,
    },
  });
}
