import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config } from "./config";

// Survive Next.js dev-mode module reloads
const g = globalThis as unknown as { __dapurDb?: Database.Database };

function init(): Database.Database {
  fs.mkdirSync(config.storageDir, { recursive: true });
  const db = new Database(path.join(config.storageDir, "dapur.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      credits INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      source TEXT NOT NULL,            -- 'upload' | 'youtube'
      source_url TEXT,
      original_name TEXT,
      file_path TEXT,
      duration_sec REAL,
      width INTEGER,
      height INTEGER,
      size_bytes INTEGER,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS processing_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      video_id TEXT NOT NULL REFERENCES videos(id),
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      total_clips INTEGER NOT NULL,
      completed_clips INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES processing_jobs(id),
      idx INTEGER NOT NULL,
      title TEXT NOT NULL,
      start_sec REAL NOT NULL,
      end_sec REAL NOT NULL,
      score INTEGER NOT NULL,
      reason TEXT,
      hook TEXT,
      caption TEXT,
      platforms TEXT,                  -- JSON array
      file_path TEXT,
      thumb_path TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT,
      job_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS social_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'disconnected',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS anon_usage (
      ip TEXT NOT NULL,
      day TEXT NOT NULL,               -- YYYY-MM-DD (UTC)
      jobs INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (ip, day)
    );
    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      clip_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      caption TEXT,
      publish_at TEXT,
      timezone TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export function getDb(): Database.Database {
  if (!g.__dapurDb) g.__dapurDb = init();
  return g.__dapurDb;
}

export const now = () => new Date().toISOString();
export const genId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
