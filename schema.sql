-- Gristmill Guns & Optics — Database Schema

-- Products
CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  price           INTEGER NOT NULL,
  sale_price      INTEGER,
  description     TEXT,
  specs           TEXT,
  image_url       TEXT,
  deposit         INTEGER NOT NULL DEFAULT 0,
  serial_number   TEXT,
  sku             TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deals queue
CREATE TABLE IF NOT EXISTS deals_queue (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_pct    INTEGER NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracks which deal ran on which day (for the no-repeat cycle)
CREATE TABLE IF NOT EXISTS deals_history (
  id              SERIAL PRIMARY KEY,
  deal_id         INTEGER NOT NULL REFERENCES deals_queue(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL,
  ran_on          DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(ran_on)
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER NOT NULL REFERENCES products(id),
  deal_id         INTEGER REFERENCES deals_queue(id),
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  amount_paid     INTEGER NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('deposit','full')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','completed','cancelled')),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin settings (key/value store)
CREATE TABLE IF NOT EXISTS settings (
  key             TEXT PRIMARY KEY,
  value           TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('firstpay_merchant_id',      ''),
  ('cloudinary_cloud_name',     ''),
  ('cloudinary_upload_preset',  ''),
  ('shop_name',                 'Gristmill Guns & Optics'),
  ('shop_phone',                '(570) 713-7339'),
  ('shop_email',                'grant@gristmillguns.com'),
  ('shop_address',              '1549 State Route 487, Orangeville PA 17859'),
  ('shop_instagram',            'gristmillguns')
ON CONFLICT (key) DO NOTHING;
