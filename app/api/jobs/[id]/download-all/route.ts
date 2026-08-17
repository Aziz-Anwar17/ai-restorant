import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { storagePaths } from "@/lib/storage";
import { run } from "@/lib/exec";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const clips = getDb()
    .prepare("SELECT file_path FROM clips WHERE job_id=? ORDER BY idx")
    .all(params.id) as { file_path: string }[];
  const files = clips
    .map((c) => c.file_path)
    .filter((f) => f && fs.existsSync(f));
  if (files.length === 0) {
    return new Response("No clips found for this job", { status: 404 });
  }

  const zipPath = path.join(storagePaths.tmp(), `${params.id}.zip`);
  fs.rmSync(zipPath, { force: true });
  await run("/usr/bin/zip", ["-j", zipPath, ...files], { timeoutMs: 120_000 });

  const stat = fs.statSync(zipPath);
  const stream = fs.createReadStream(zipPath);
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="dapur-ai-clips.zip"`,
    },
  });
}
