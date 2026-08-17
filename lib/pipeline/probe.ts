import { run } from "../exec";
import { config } from "../config";

export type VideoInfo = {
  durationSec: number;
  width: number;
  height: number;
};

export async function probeVideo(filePath: string): Promise<VideoInfo> {
  const { stdout } = await run(config.ffprobeBin, [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height:format=duration",
    "-of",
    "json",
    filePath,
  ]);
  const data = JSON.parse(stdout);
  const stream = data.streams?.[0];
  const duration = Number(data.format?.duration);
  if (!stream || !Number.isFinite(duration)) {
    throw new Error("Could not read video metadata");
  }
  return {
    durationSec: duration,
    width: Number(stream.width),
    height: Number(stream.height),
  };
}
