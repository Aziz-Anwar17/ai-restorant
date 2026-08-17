import path from "path";
import fs from "fs";
import { config } from "./config";

export function ensureDir(dir: string): string {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const storagePaths = {
  uploads: () => ensureDir(path.join(config.storageDir, "uploads")),
  audio: () => ensureDir(path.join(config.storageDir, "audio")),
  transcripts: () => ensureDir(path.join(config.storageDir, "transcripts")),
  clips: (jobId: string) =>
    ensureDir(path.join(config.storageDir, "clips", jobId)),
  thumbs: (jobId: string) =>
    ensureDir(path.join(config.storageDir, "thumbs", jobId)),
  tmp: () => ensureDir(path.join(config.storageDir, "tmp")),
};

export function cleanupFiles(files: string[]) {
  for (const f of files) {
    try {
      fs.rmSync(f, { force: true });
    } catch {
      /* best effort */
    }
  }
}
