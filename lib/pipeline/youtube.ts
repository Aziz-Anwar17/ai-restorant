import path from "path";
import { run } from "../exec";
import { config } from "../config";
import { storagePaths } from "../storage";

const YT_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function validateYouTubeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http(s) YouTube links are supported.");
  }
  if (!YT_HOSTS.has(url.hostname)) {
    throw new Error("Only YouTube links are supported for now.");
  }
  return url;
}

export type YouTubeMeta = {
  title: string;
  durationSec: number;
};

export async function fetchYouTubeMeta(url: string): Promise<YouTubeMeta> {
  const { stdout } = await run(
    config.ytdlpBin,
    ["--no-playlist", "--print", "%(title)s\n%(duration)s", "--", url],
    { timeoutMs: 60_000 }
  );
  const [title, durationRaw] = stdout.trim().split("\n");
  const durationSec = Number(durationRaw);
  if (!title || !Number.isFinite(durationSec)) {
    throw new Error("Could not read video info from YouTube.");
  }
  return { title, durationSec };
}

export async function downloadYouTubeVideo(
  url: string,
  videoId: string
): Promise<string> {
  const outPath = path.join(storagePaths.uploads(), `${videoId}.mp4`);
  await run(
    config.ytdlpBin,
    [
      "--no-playlist",
      "-f",
      "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
      "--merge-output-format",
      "mp4",
      "-o",
      outPath,
      "--",
      url,
    ],
    { timeoutMs: 30 * 60_000 }
  );
  return outPath;
}
