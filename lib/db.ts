import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'shortener.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var _sqliteDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (globalThis._sqliteDb) {
    return globalThis._sqliteDb;
  }

  const db = new Database(DB_PATH, { timeout: 5000 });
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  // Initialize tables and indices
  initSchema(db);

  globalThis._sqliteDb = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id TEXT PRIMARY KEY,
      url_id TEXT NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT,
      referer TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_urls_code ON urls(code);
    CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
    CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_clicks_url_time ON clicks(url_id, timestamp DESC);
  `);
}

export default getDb;
