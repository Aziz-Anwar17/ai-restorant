import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

const tool: Anthropic.Tool = {
  name: "social_captions",
  description: "Per-platform social media captions for a short-form clip.",
  input_schema: {
    type: "object" as const,
    properties: {
      youtube: { type: "string" },
      tiktok: { type: "string" },
      instagram: { type: "string" },
      linkedin: { type: "string" },
      x: { type: "string" },
    },
    required: ["youtube", "tiktok", "instagram", "linkedin", "x"],
  },
};

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!config.anthropicApiKey) {
    return NextResponse.json(
      { error: "AI caption generation is not configured (ANTHROPIC_API_KEY missing)." },
      { status: 503 }
    );
  }
  const clip = getDb()
    .prepare("SELECT title, hook, caption, reason FROM clips WHERE id=?")
    .get(params.id) as
    | { title: string; hook: string; caption: string; reason: string }
    | undefined;
  if (!clip) {
    return NextResponse.json({ error: "Clip not found." }, { status: 404 });
  }

  try {
    const client = new Anthropic({ apiKey: config.anthropicApiKey });
    const resp = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      system:
        "You write platform-native social captions for short-form video. Match each platform's culture: YouTube Shorts (searchable title-style + hashtags), TikTok (casual, trending hashtags), Instagram Reels (punchy + emoji + hashtags), LinkedIn (professional insight framing, minimal hashtags), X (sharp hook, no hashtag spam). Keep each under the platform's comfortable length. Use the select tool only.",
      tools: [tool],
      tool_choice: { type: "tool", name: "social_captions" },
      messages: [
        {
          role: "user",
          content: `Clip title: ${clip.title}\nHook: ${clip.hook}\nBase caption: ${clip.caption}\nWhy it works: ${clip.reason}`,
        },
      ],
    });
    const toolUse = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) throw new Error("no tool call");
    return NextResponse.json({ captions: toolUse.input });
  } catch (e) {
    console.error("[social-captions] error:", e);
    return NextResponse.json(
      { error: "Couldn't generate captions. Please try again." },
      { status: 502 }
    );
  }
}
