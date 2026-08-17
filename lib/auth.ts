import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDb, now } from "./db";
import { config } from "./config";

/**
 * Server-side Firebase ID token verification via Google's public JWKS —
 * no service-account key required. Returns null for anonymous requests.
 */

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export type AuthedUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  credits: number;
};

export const authConfigured = () => FIREBASE_PROJECT_ID.length > 0;

export async function getUserFromRequest(
  req: Request
): Promise<AuthedUser | null> {
  if (!authConfigured()) return null;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    const uid = String(payload.sub ?? "");
    if (!uid) return null;
    return ensureUser(
      uid,
      typeof payload.email === "string" ? payload.email : null,
      typeof payload.name === "string" ? payload.name : null
    );
  } catch {
    return null; // invalid/expired token → treat as anonymous
  }
}

/** Get or create the local user row; new users receive the free credit grant. */
function ensureUser(
  uid: string,
  email: string | null,
  displayName: string | null
): AuthedUser {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, email, display_name, credits FROM users WHERE id=?")
    .get(uid) as
    | { id: string; email: string | null; display_name: string | null; credits: number }
    | undefined;

  if (existing) {
    if (email && email !== existing.email) {
      db.prepare("UPDATE users SET email=?, display_name=? WHERE id=?").run(
        email,
        displayName ?? existing.display_name,
        uid
      );
    }
    return {
      uid,
      email: email ?? existing.email,
      displayName: displayName ?? existing.display_name,
      credits: existing.credits,
    };
  }

  db.prepare(
    "INSERT INTO users (id, email, display_name, credits, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(uid, email, displayName, config.freeCredits, now());
  db.prepare(
    "INSERT INTO credit_transactions (id, user_id, amount, reason, job_id, created_at) VALUES (?, ?, ?, 'signup_bonus', NULL, ?)"
  ).run(`ctx_${uid.slice(0, 8)}_${Date.now().toString(36)}`, uid, config.freeCredits, now());

  return { uid, email, displayName, credits: config.freeCredits };
}

export function deductCredits(
  uid: string,
  amount: number,
  jobId: string
): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE users SET credits = credits - ? WHERE id=? AND credits >= ?")
    .run(amount, uid, amount);
  if (result.changes === 0) return false;
  db.prepare(
    "INSERT INTO credit_transactions (id, user_id, amount, reason, job_id, created_at) VALUES (?, ?, ?, 'clip_generation', ?, ?)"
  ).run(`ctx_${jobId}_${Date.now().toString(36)}`, uid, -amount, jobId, now());
  return true;
}

export function refundCredits(uid: string, amount: number, jobId: string) {
  if (amount <= 0) return;
  const db = getDb();
  db.prepare("UPDATE users SET credits = credits + ? WHERE id=?").run(amount, uid);
  db.prepare(
    "INSERT INTO credit_transactions (id, user_id, amount, reason, job_id, created_at) VALUES (?, ?, ?, 'refund_failed_clips', ?, ?)"
  ).run(`ctx_r_${jobId}_${Date.now().toString(36)}`, uid, amount, jobId, now());
}

export function getCredits(uid: string): number {
  const row = getDb()
    .prepare("SELECT credits FROM users WHERE id=?")
    .get(uid) as { credits: number } | undefined;
  return row?.credits ?? 0;
}
