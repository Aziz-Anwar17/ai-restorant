import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config";
import type { Transcript } from "./transcribe";

export const ClipPlanSchema = z.object({
  clips: z
    .array(
      z.object({
        title: z.string().min(1),
        start: z.number().min(0),
        end: z.number().min(0),
        score: z.number().min(0).max(100),
        reason: z.string(),
        hook: z.string(),
        caption: z.string(),
        platforms: z.array(z.string()).min(1),
      })
    )
    .min(1),
});
export type ClipPlan = z.infer<typeof ClipPlanSchema>;

const SYSTEM_PROMPT = `You are an expert short-form video editor and viral content strategist.
Analyze the provided timestamped transcript and identify the strongest self-contained moments that can become engaging short-form videos.
Prioritize strong hooks, surprising insights, emotional moments, useful information, humor, storytelling, controversial opinions, and moments likely to retain viewer attention.
Each selected clip must:
- make sense without the full video
- begin with a compelling moment
- avoid unnecessary dead air
- have a clear ending
- contain enough context
- be AT MOST 90 seconds long — this is a hard limit, never exceed it. Aim for 20-60 seconds; if a strong story arc is longer than 90 seconds, select only its most powerful 90-second (or shorter) portion instead of the whole arc. Shorter than 20 seconds is acceptable only if the source video is very short.
- not overlap substantially with another selected clip
Start and end timestamps MUST fall within the transcript's time range and align with natural sentence boundaries.
Use the select_clips tool to return your answer. Respond with the tool call only.`;

const selectClipsTool: Anthropic.Tool = {
  name: "select_clips",
  description: "Return the selected short-form clips as structured data.",
  input_schema: {
    type: "object" as const,
    properties: {
      clips: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            start: { type: "number", description: "seconds" },
            end: { type: "number", description: "seconds" },
            score: {
              type: "number",
              description: "integer 0-100, where 100 = highest viral potential",
            },
            reason: { type: "string" },
            hook: { type: "string" },
            caption: { type: "string" },
            platforms: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "youtube_shorts",
                  "tiktok",
                  "instagram_reels",
                  "facebook",
                  "linkedin",
                  "x",
                ],
              },
            },
          },
          required: [
            "title", "start", "end", "score", "reason", "hook", "caption", "platforms",
          ],
        },
      },
    },
    required: ["clips"],
  },
};

function transcriptToPrompt(t: Transcript): string {
  return t.segments
    .map((s) => `[${s.start.toFixed(2)} → ${s.end.toFixed(2)}] ${s.text}`)
    .join("\n");
}

const MAX_CLIP_SEC = 90;

export async function selectClips(
  transcript: Transcript,
  clipCount: number,
  videoDurationSec: number
): Promise<ClipPlan> {
  if (!config.anthropicApiKey) {
    throw new Error(
      "AI analysis is not configured: ANTHROPIC_API_KEY is missing. Add it to .env.local."
    );
  }
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const userMsg = `Video duration: ${videoDurationSec.toFixed(1)} seconds.
Select up to ${clipCount} clips (fewer only if the video genuinely doesn't contain that many distinct strong moments).

Timestamped transcript:
${transcriptToPrompt(transcript)}`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const resp = await client.messages.create({
        model: config.anthropicModel,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [selectClipsTool],
        tool_choice: { type: "tool", name: "select_clips" },
        messages: [{ role: "user", content: userMsg }],
      });
      const toolUse = resp.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      if (!toolUse) throw new Error("Model returned no tool call");
      const rawInput = toolUse.input as { clips?: unknown };
      if (!Array.isArray(rawInput?.clips) || rawInput.clips.length === 0) {
        throw new Error(
          "AI Restorant couldn't find a self-contained short-form moment in this video — it may be too short. Try a longer video."
        );
      }
      const plan = ClipPlanSchema.parse(rawInput);

      // sanitize: clamp to video bounds, drop invalid ranges, cap count
      const clips = plan.clips
        .map((c) => ({
          ...c,
          start: Math.max(0, c.start),
          // hard safety net: never render past the 90s cap even if the model ignores it
          end: Math.min(videoDurationSec, c.end, Math.max(0, c.start) + MAX_CLIP_SEC),
          // tolerate models answering on a 0-1 scale despite the 0-100 spec
          score: Math.round(c.score <= 1 ? c.score * 100 : c.score),
        }))
        .filter((c) => c.end - c.start >= 3)
        .sort((a, b) => b.score - a.score)
        .slice(0, clipCount);
      if (clips.length === 0) {
        throw new Error("Model selected no valid clip ranges");
      }
      return { clips };
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    `AI clip selection failed after retries: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
