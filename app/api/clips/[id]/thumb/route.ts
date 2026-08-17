import fs from "fs";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const clip = getDb()
    .prepare("SELECT thumb_path FROM clips WHERE id=?")
    .get(params.id) as { thumb_path: string } | undefined;
  if (!clip?.thumb_path || !fs.existsSync(clip.thumb_path)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(fs.readFileSync(clip.thumb_path), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" },
  });
}
