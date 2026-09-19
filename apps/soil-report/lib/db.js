import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.SOIL_DB_PATH || path.join(DATA_DIR, "soil-report.db");

// Reuse a single connection across hot reloads in dev.
const globalForDb = globalThis;

function createConnection() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db = globalForDb.__soilDb || createConnection();
if (process.env.NODE_ENV !== "production") globalForDb.__soilDb = db;

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  role          TEXT NOT NULL CHECK (role IN ('customer','admin')),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  company       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metrics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  key          TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  unit         TEXT
);

CREATE TABLE IF NOT EXISTS usages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Global source-column-header -> canonical metric key matching. header_text
-- is normalized (lowercased, punctuation stripped) so lookups are exact-match
-- first; parsers/index.js falls back to fuzzy matching against this table
-- and writes the header back here on a confident guess (confirmed = 0), so
-- the next report with that exact header short-circuits to an exact match.
-- Not tied to a lab: with only a couple of labs in practice, one global
-- table beats making customers pick which lab format they have.
CREATE TABLE IF NOT EXISTS column_aliases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  header_text TEXT NOT NULL UNIQUE,
  metric_key  TEXT NOT NULL, -- a metrics.key value, or the literal 'sample_id'
  confirmed   INTEGER NOT NULL DEFAULT 1, -- 1 = admin-entered/seeded, 0 = auto-learned via fuzzy match
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS report_templates (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  usage_id INTEGER NOT NULL REFERENCES usages(id) ON DELETE CASCADE,
  sections TEXT NOT NULL DEFAULT '[]' -- JSON ordered list of section keys
);

CREATE TABLE IF NOT EXISTS products (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  store_url TEXT NOT NULL,
  category  TEXT
);

CREATE TABLE IF NOT EXISTS rules (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  usage_id           INTEGER NOT NULL REFERENCES usages(id) ON DELETE CASCADE,
  metric_id          INTEGER NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  band_low           REAL,
  band_high          REAL,
  band_label         TEXT NOT NULL, -- Very Low / Low / Medium / High / Very High
  recommendation_text TEXT,
  product_id         INTEGER REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_id       INTEGER REFERENCES usages(id),
  original_filename TEXT,
  status         TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','paid','generated')),
  flagged_columns TEXT DEFAULT '[]', -- JSON list of unmapped source columns
  auto_matched_columns TEXT DEFAULT '[]', -- JSON list of {sourceLabel, metricKey} guessed via fuzzy match
  assembled_data TEXT, -- JSON: rules-engine output, cached once generated
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samples (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id  INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  sample_id  TEXT,
  raw_values TEXT NOT NULL DEFAULT '{}' -- JSON: metric key -> numeric value
);

CREATE TABLE IF NOT EXISTS payments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id    INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL, -- cents
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  provider_ref TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

db.exec(SCHEMA);
