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

const registry: Record<Platform, SocialPublisher> = {
  youtube_shorts: new NotConfiguredPublisher("youtube_shorts"),
  tiktok: new NotConfiguredPublisher("tiktok"),
  instagram_reels: new NotConfiguredPublisher("instagram_reels"),
  facebook: new NotConfiguredPublisher("facebook"),
  linkedin: new NotConfiguredPublisher("linkedin"),
  x: new NotConfiguredPublisher("x"),
};

export function getPublisher(platform: Platform): SocialPublisher {
  return registry[platform];
}
