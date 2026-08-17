/**
 * Social publishing abstraction (Phase 3 foundation).
 *
 * No adapter is wired to a real API yet — every adapter honestly reports
 * `not_configured` rather than pretending to publish. When platform APIs are
 * added, implement one adapter per platform without touching callers.
 */

export type Platform =
  | "youtube_shorts"
  | "tiktok"
  | "instagram_reels"
  | "facebook"
  | "linkedin"
  | "x";

export type PublishStatus =
  | "not_configured"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export interface SocialPublisher {
  readonly platform: Platform;
  connectAccount(userId: string): Promise<{ status: PublishStatus; authUrl?: string }>;
  publishVideo(opts: { clipPath: string; caption: string }): Promise<{ status: PublishStatus; postUrl?: string }>;
  scheduleVideo(opts: { clipPath: string; caption: string; publishAt: Date; timezone: string }): Promise<{ status: PublishStatus }>;
  getPublishStatus(postId: string): Promise<PublishStatus>;
  disconnectAccount(userId: string): Promise<void>;
}

class NotConfiguredPublisher implements SocialPublisher {
  constructor(readonly platform: Platform) {}
  async connectAccount() {
    return { status: "not_configured" as const };
  }
  async publishVideo() {
    return { status: "not_configured" as const };
  }
  async scheduleVideo() {
    return { status: "not_configured" as const };
  }
  async getPublishStatus() {
    return "not_configured" as const;
  }
  async disconnectAccount() {}
}

import { youtubeConfigured, getChannelInfo, uploadShort } from "./youtube";

class YouTubeShortsPublisher implements SocialPublisher {
  readonly platform = "youtube_shorts" as const;
  async connectAccount() {
    if (!youtubeConfigured()) return { status: "not_configured" as const };
    await getChannelInfo(); // verifies credentials
    return { status: "published" as const };
  }
  async publishVideo(opts: { clipPath: string; caption: string; title?: string; privacy?: "private" | "unlisted" | "public" }) {
    if (!youtubeConfigured()) return { status: "not_configured" as const };
    const { url } = await uploadShort({
      filePath: opts.clipPath,
      title: opts.title ?? opts.caption.slice(0, 90),
      description: opts.caption,
      privacy: opts.privacy ?? "public",
    });
    return { status: "published" as const, postUrl: url };
  }
  async scheduleVideo(opts: { clipPath: string; caption: string; publishAt: Date; timezone: string; title?: string }) {
    if (!youtubeConfigured()) return { status: "not_configured" as const };
    await uploadShort({
      filePath: opts.clipPath,
      title: opts.title ?? opts.caption.slice(0, 90),
      description: opts.caption,
      privacy: "private",
      publishAt: opts.publishAt.toISOString(),
    });
    return { status: "scheduled" as const };
  }
  async getPublishStatus() {
    return "published" as const;
  }
  async disconnectAccount() {}
}

const registry: Record<Platform, SocialPublisher> = {
  youtube_shorts: new YouTubeShortsPublisher(),
  tiktok: new NotConfiguredPublisher("tiktok"),
  instagram_reels: new NotConfiguredPublisher("instagram_reels"),
  facebook: new NotConfiguredPublisher("facebook"),
  linkedin: new NotConfiguredPublisher("linkedin"),
  x: new NotConfiguredPublisher("x"),
};

export function getPublisher(platform: Platform): SocialPublisher {
  return registry[platform];
}
