/**
 * One-shot YouTube OAuth flow (loopback) for AI Restorant.
 * Run: node --env-file=.env.local scripts/youtube-oauth.mjs
 * Opens an auth URL; after you approve, the refresh token is written to
 * .env.local (YOUTUBE_REFRESH_TOKEN) and the connected channel is printed.
 */
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const PORT = 8765;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET missing in .env.local");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent select_account", // force account/brand-channel picker + refresh token
  });

console.log("AUTH_URL_START");
console.log(authUrl);
console.log("AUTH_URL_END");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  if (err || !code) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Authorization was cancelled. You can close this tab.</h2>");
    console.error("RESULT: cancelled", err);
    server.close();
    process.exit(2);
  }

  try {
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT,
      }),
    }).then((r) => r.json());

    if (!tok.refresh_token) throw new Error(JSON.stringify(tok));

    const ch = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${tok.access_token}` } }
    ).then((r) => r.json());
    const channel = ch.items?.[0]?.snippet?.title ?? "(unknown channel)";

    // update .env.local in place
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.join(__dirname, "..", ".env.local");
    let env = fs.readFileSync(envPath, "utf8");
    env = env.replace(/^YOUTUBE_REFRESH_TOKEN=.*$/m, `YOUTUBE_REFRESH_TOKEN=${tok.refresh_token}`);
    fs.writeFileSync(envPath, env);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<body style="font-family:sans-serif;background:#0a0a0f;color:#fff;display:grid;place-items:center;height:100vh;margin:0">
      <div style="text-align:center"><h2>✅ Channel terhubung: ${channel}</h2><p>AI Restorant siap publish ke channel ini. Tab ini boleh ditutup.</p></div></body>`);
    console.log("RESULT: connected");
    console.log("CHANNEL:", channel);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end("<h2>Token exchange failed — check the terminal.</h2>");
    console.error("RESULT: failed", String(e));
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 200);
  }
});

server.listen(PORT, () => console.log(`listening on ${REDIRECT}`));
setTimeout(() => { console.error("RESULT: timeout (60 min)"); process.exit(3); }, 3_600_000);
