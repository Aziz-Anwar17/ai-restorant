import { NextResponse } from "next/server";
import fs from "fs";
import { config, type DependencyReport } from "@/lib/config";
import { which } from "@/lib/exec";

export const runtime = "nodejs";

export async function GET() {
  const [ffmpeg, ytdlp] = await Promise.all([
    which(config.ffmpegBin),
    which(config.ytdlpBin),
  ]);
  const whisper =
    fs.existsSync(config.whisperBin) && fs.existsSync(config.whisperModel);
  const anthropic = config.anthropicApiKey.length > 0;

  const missing: string[] = [];
  if (!ffmpeg) missing.push("ffmpeg");
  if (!whisper) missing.push("whisper.cpp (binary or model)");
  if (!ytdlp) missing.push("yt-dlp");
  if (!anthropic) missing.push("ANTHROPIC_API_KEY");

  const report: DependencyReport = {
    ffmpeg,
    whisper,
    ytdlp,
    anthropic,
    ready: missing.length === 0,
    missing,
  };
  return NextResponse.json(report);
}
