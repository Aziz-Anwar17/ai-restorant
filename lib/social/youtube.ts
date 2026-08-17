import fs from "fs";

/**
 * YouTube publisher backed by server-configured OAuth credentials
 * (YOUTUBE_CLIENT_ID / SECRET / REFRESH_TOKEN). Publishes to the channel that
 * granted the refresh token. Per-user OAuth connect is a documented future
 * upgrade — the abstraction stays the same.
 */

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET ?? "";
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN ?? "";

export const youtubeConfigured = () =>
  Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(
      `YouTube token refresh failed: ${data.error_description ?? data.error ?? res.status}`
    );
  }
  return data.access_token;
}

export async function getChannelInfo(): Promise<{ id: string; title: string }> {
  const token = await getAccessToken();
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const ch = data.items?.[0];
  if (!res.ok || !ch) {
    throw new Error(`Couldn't read YouTube channel: ${data.error?.message ?? res.status}`);
  }
  return { id: ch.id, title: ch.snippet.title };
}

export async function uploadShort(opts: {
  filePath: string;
  title: string;
  description: string;
  tags?: string[];
  privacy: "private" | "unlisted" | "public";
  publishAt?: string; // ISO — requires privacy 'private'; YouTube flips to public at that time
}): Promise<{ videoId: string; url: string }> {
  const token = await getAccessToken();
  const stat = fs.statSync(opts.filePath);

  const status: Record<string, unknown> = {
    privacyStatus: opts.publishAt ? "private" : opts.privacy,
    selfDeclaredMadeForKids: false,
  };
  if (opts.publishAt) status.publishAt = opts.publishAt;

  const meta = {
    snippet: {
      title: opts.title.slice(0, 100),
      description: opts.description.slice(0, 4900),
      tags: opts.tags?.slice(0, 30),
      categoryId: "22",
    },
    status,
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(stat.size),
      },
      body: JSON.stringify(meta),
    }
  );
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(
      `YouTube upload init failed: ${(err as { error?: { message?: string } }).error?.message ?? initRes.status}`
    );
  }
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube upload init returned no upload URL");

  const buf = fs.readFileSync(opts.filePath);
  const upRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(stat.size) },
    body: buf,
  });
  const upData = await upRes.json().catch(() => ({}));
  if (!upRes.ok || !(upData as { id?: string }).id) {
    throw new Error(
      `YouTube upload failed: ${(upData as { error?: { message?: string } }).error?.message ?? upRes.status}`
    );
  }
  const videoId = (upData as { id: string }).id;
  return { videoId, url: `https://youtube.com/shorts/${videoId}` };
}

export async function deleteVideo(videoId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(`YouTube delete failed: ${res.status}`);
  }
}
