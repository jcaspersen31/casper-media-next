-- Soil Deficiency Report — schema

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('customer','admin')),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  company       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  id           SERIAL PRIMARY KEY,
  key          TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  unit         TEXT
);

CREATE TABLE IF NOT EXISTS usages (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Global source-column-header -> canonical metric key matching. header_text
-- is normalized (lowercased, punctuation stripped) so lookups are exact-match
-- first; lib/parsers/index.js falls back to fuzzy matching against this
-- table and writes the header back here on a confident guess (confirmed =
-- 0), so the next report with that exact header short-circuits to an exact
-- match. Not tied to a lab: with only a couple of labs in practice, one
-- global table beats making customers pick which lab format they have.
CREATE TABLE IF NOT EXISTS column_aliases (
  id          SERIAL PRIMARY KEY,
  header_text TEXT NOT NULL UNIQUE,
  metric_key  TEXT NOT NULL, -- a metrics.key value, or the literal 'sample_id'
  confirmed   INTEGER NOT NULL DEFAULT 1, -- 1 = admin-entered/seeded, 0 = auto-learned via fuzzy match
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id       SERIAL PRIMARY KEY,
  usage_id INTEGER NOT NULL REFERENCES usages(id) ON DELETE CASCADE,
  sections TEXT NOT NULL DEFAULT '[]' -- JSON ordered list of section keys
);

CREATE TABLE IF NOT EXISTS products (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  store_url TEXT NOT NULL,
  category  TEXT
);

CREATE TABLE IF NOT EXISTS rules (
  id                 SERIAL PRIMARY KEY,
  usage_id           INTEGER NOT NULL REFERENCES usages(id) ON DELETE CASCADE,
  metric_id          INTEGER NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  band_low           REAL,
  band_high          REAL,
  band_label         TEXT NOT NULL, -- Very Low / Low / Medium / High / Very High
  recommendation_text TEXT,
  product_id         INTEGER REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id             SERIAL PRIMARY KEY,
  customer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_id       INTEGER REFERENCES usages(id),
  original_filename TEXT,
  status         TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','paid','generated')),
  flagged_columns TEXT DEFAULT '[]', -- JSON list of unmapped source columns
  auto_matched_columns TEXT DEFAULT '[]', -- JSON list of {sourceLabel, metricKey} guessed via fuzzy match
  assembled_data TEXT, -- JSON: rules-engine output, cached once generated
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS samples (
  id         SERIAL PRIMARY KEY,
  report_id  INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  sample_id  TEXT,
  raw_values TEXT NOT NULL DEFAULT '{}' -- JSON: metric key -> numeric value
);

CREATE TABLE IF NOT EXISTS payments (
  id           SERIAL PRIMARY KEY,
  report_id    INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL, -- cents
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  provider_ref TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
