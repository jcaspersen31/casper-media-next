-- One-time setup for a fresh Railway Postgres instance: paste this whole
-- file into Railway's Postgres service -> "Query" tab and run it. Combines
-- schema.sql + the demo seed data from scripts/seed.mjs (with passwords
-- already bcrypt-hashed, since that tab only runs SQL, not Node). Safe to
-- re-run — every insert is guarded.

-- ===== schema =====

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

CREATE TABLE IF NOT EXISTS column_aliases (
  id          SERIAL PRIMARY KEY,
  header_text TEXT NOT NULL UNIQUE,
  metric_key  TEXT NOT NULL,
  confirmed   INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id       SERIAL PRIMARY KEY,
  usage_id INTEGER NOT NULL REFERENCES usages(id) ON DELETE CASCADE,
  sections TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS report_sections (
  id                SERIAL PRIMARY KEY,
  key               TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('metric_table','narrative','product_list')),
  intro_text        TEXT,
  metric_keys       TEXT,
  sentence_template TEXT,
  product_category  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  band_label         TEXT NOT NULL,
  recommendation_text TEXT,
  product_id         INTEGER REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id             SERIAL PRIMARY KEY,
  customer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_id       INTEGER REFERENCES usages(id),
  original_filename TEXT,
  status         TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','paid','generated')),
  flagged_columns TEXT DEFAULT '[]',
  auto_matched_columns TEXT DEFAULT '[]',
  assembled_data TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS samples (
  id         SERIAL PRIMARY KEY,
  report_id  INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  sample_id  TEXT,
  raw_values TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS payments (
  id           SERIAL PRIMARY KEY,
  report_id    INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  provider_ref TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== demo users =====
-- admin@caspermediallc.com / admin1234
-- customer@example.com / customer1234

INSERT INTO users (role, email, password_hash, name, company) VALUES
  ('admin', 'admin@caspermediallc.com', '$2a$10$nZM8/w282k/oppJJfK1d3e8nIfWKCoE7S7HtL78cXlVNoNkY4RB5K', 'Demo Admin', 'Casper Media LLC'),
  ('customer', 'customer@example.com', '$2a$10$qSMSVjeBJ1.sspNCiN5y7edekbyB4ic1cQqx.SnxQHkOe11eT.HfW', 'Demo Customer', 'Example Farms')
ON CONFLICT (email) DO NOTHING;

-- ===== metrics =====

INSERT INTO metrics (key, display_name, unit) VALUES
  ('Soil_pH', 'Soil pH', ''),
  ('H3A_P', 'Phosphorus (H3A)', 'ppm'),
  ('H3A_K', 'Potassium (H3A)', 'ppm'),
  ('WEOC', 'Water Extractable Organic Carbon', 'ppm'),
  ('WEON', 'Water Extractable Organic Nitrogen', 'ppm'),
  ('CEC', 'Cation Exchange Capacity', 'meq/100g'),
  ('Ca_Sat', 'Calcium Saturation', '%'),
  ('Mg_Sat', 'Magnesium Saturation', '%'),
  ('K_Ca_ratio', 'K:Ca Ratio', ''),
  ('Organic_Matter', 'Organic Matter', '%'),
  ('Soil_Health_Score', 'Soil Health Score', ''),
  -- Captured from real Haney-test exports but no rules yet — see /admin/rules.
  ('WDRF_Buffer', 'WDRF Buffer pH', ''),
  ('Soluble_Salt', 'Soluble Salt (1:1)', 'mmhos/cm'),
  ('Excess_Lime', 'Excess Lime', ''),
  ('CO2_C', 'CO2-C Respiration', 'ppm'),
  ('H2O_Total_N', 'Water Extractable Total N', 'ppm'),
  ('H3A_Nitrate', 'Nitrate (H3A)', 'ppm'),
  ('H3A_Ammonium', 'Ammonium (H3A)', 'ppm'),
  ('H3A_Inorganic_N', 'Inorganic Nitrogen (H3A)', 'ppm'),
  ('H3A_Total_P', 'Total Phosphorus (H3A)', 'ppm'),
  ('H3A_Organic_P', 'Organic Phosphorus (H3A)', 'ppm'),
  ('H3A_Ca', 'Calcium (H3A)', 'ppm'),
  ('H3A_Al', 'Aluminum (H3A)', 'ppm'),
  ('H3A_Fe', 'Iron (H3A)', 'ppm'),
  ('H3A_S', 'Sulfur (H3A)', 'ppm'),
  ('H3A_Zn', 'Zinc (H3A)', 'ppm'),
  ('H3A_Mn', 'Manganese (H3A)', 'ppm'),
  ('H3A_Cu', 'Copper (H3A)', 'ppm'),
  ('H3A_Mg', 'Magnesium (H3A)', 'ppm'),
  ('H3A_Na', 'Sodium (H3A)', 'ppm'),
  ('MAC_Pct', 'Microbially Active Carbon', '%'),
  ('Organic_CN_Ratio', 'Organic C:N Ratio', ''),
  ('Organic_Inorganic_N_Ratio', 'Organic N : Inorganic N Ratio', ''),
  ('Organic_N_Release', 'Organic N Release', 'lbs/ac'),
  ('Organic_N_Reserve', 'Organic N Reserve', 'lbs/ac'),
  ('Organic_P_Release', 'Organic P Release', 'lbs/ac'),
  ('Organic_P_Reserve', 'Organic P Reserve', 'lbs/ac'),
  ('Available_N', 'Available N', 'lbs/ac'),
  ('Available_P', 'Available P', 'lbs/ac'),
  ('Available_K', 'Available K', 'lbs/ac'),
  ('Nutrient_Value', 'Nutrient Value', '$/ac'),
  ('Traditional_N', 'Traditional N Recommendation', 'lbs/ac'),
  ('Haney_Test_N', 'Haney Test N Recommendation', 'lbs/ac'),
  ('Lbs_N_Difference', 'N Recommendation Difference', 'lbs/ac'),
  ('N_Savings', 'N Savings', '$/ac')
ON CONFLICT (key) DO NOTHING;

-- ===== usages =====

INSERT INTO usages (name, description) VALUES
  ('Row Crop Farming', 'Commodity row crops such as corn and soybeans.'),
  ('Food Plot / Wildlife', 'Food plots and wildlife forage management.')
ON CONFLICT (name) DO NOTHING;

-- ===== products =====

INSERT INTO products (name, store_url, category)
SELECT v.name, v.store_url, v.category FROM (VALUES
  ('Ag Lime Pallet', 'https://example-store.com/products/ag-lime', 'lime'),
  ('MAP Starter Fertilizer', 'https://example-store.com/products/map-fertilizer', 'fertilizer'),
  ('Potash 0-0-60', 'https://example-store.com/products/potash', 'fertilizer'),
  ('Humic Acid Soil Conditioner', 'https://example-store.com/products/humic-acid', 'soil_amendment'),
  ('Clover & Brassica Cool Season Mix', 'https://example-store.com/products/cool-season-mix', 'cool_season_seed'),
  ('Sunflower & Sorghum Warm Season Mix', 'https://example-store.com/products/warm-season-mix', 'warm_season_seed')
) AS v(name, store_url, category)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

-- ===== report_sections =====

INSERT INTO report_sections (key, title, type, intro_text, metric_keys, sentence_template, product_category) VALUES
  ('biology_narrative', 'Soil Biology', 'narrative',
   'Soil biology drives how well your ground cycles nutrients and holds structure. Here''s what this sample shows:',
   '["WEOC","WEON","Organic_Matter","Soil_Health_Score"]',
   '{metric} measured {value}{unit}, rated {band}. {recommendation}',
   NULL),
  ('crop_fertilizer_table', 'Fertility Recommendations', 'metric_table', NULL, NULL, NULL, NULL),
  ('lime_recommendation', 'Lime Recommendation', 'metric_table', NULL, '["Soil_pH","Ca_Sat"]', NULL, NULL),
  ('cool_season_mix', 'Cool Season Mix Recommendations', 'product_list', NULL, NULL, NULL, 'cool_season_seed'),
  ('warm_season_mix', 'Warm Season Mix Recommendations', 'product_list', NULL, NULL, NULL, 'warm_season_seed'),
  ('seasonal_nutrient_table', 'Nutrient Levels', 'metric_table', NULL, NULL, NULL, NULL)
ON CONFLICT (key) DO NOTHING;

-- ===== report_templates =====

INSERT INTO report_templates (usage_id, sections)
SELECT id, '["biology_narrative","crop_fertilizer_table"]' FROM usages WHERE name = 'Row Crop Farming'
  AND NOT EXISTS (SELECT 1 FROM report_templates rt WHERE rt.usage_id = usages.id);

INSERT INTO report_templates (usage_id, sections)
SELECT id, '["lime_recommendation","cool_season_mix","warm_season_mix","seasonal_nutrient_table"]' FROM usages WHERE name = 'Food Plot / Wildlife'
  AND NOT EXISTS (SELECT 1 FROM report_templates rt WHERE rt.usage_id = usages.id);

-- ===== rules =====
-- Demo thresholds only — client to confirm real bands.

INSERT INTO rules (usage_id, metric_id, band_low, band_high, band_label, recommendation_text, product_id)
SELECT u.id, m.id, v.band_low, v.band_high, v.band_label, v.recommendation_text, p.id
FROM (VALUES
  ('Row Crop Farming', 'Soil_pH', NULL, 5.8, 'Low', 'Soil is acidic; lime is recommended before planting.', 'Ag Lime Pallet'),
  ('Row Crop Farming', 'Soil_pH', 5.8, 7.2, 'Medium', 'pH is in an acceptable range for most row crops.', NULL),
  ('Row Crop Farming', 'Soil_pH', 7.2, NULL, 'High', 'Soil is alkaline; monitor micronutrient availability.', NULL),
  ('Row Crop Farming', 'H3A_P', NULL, 15, 'Low', 'Phosphorus is deficient; apply a starter fertilizer at planting.', 'MAP Starter Fertilizer'),
  ('Row Crop Farming', 'H3A_P', 15, 40, 'Medium', 'Phosphorus levels are adequate.', NULL),
  ('Row Crop Farming', 'H3A_P', 40, NULL, 'High', 'Phosphorus is in excess; reduce applications.', NULL),
  ('Row Crop Farming', 'H3A_K', NULL, 100, 'Low', 'Potassium is deficient; apply potash to correct.', 'Potash 0-0-60'),
  ('Row Crop Farming', 'H3A_K', 100, 250, 'Medium', 'Potassium levels are adequate.', NULL),
  ('Row Crop Farming', 'H3A_K', 250, NULL, 'High', 'Potassium is sufficient to excessive.', NULL),
  ('Row Crop Farming', 'WEOC', NULL, 100, 'Low', 'Low biological activity; consider a cover crop and reduced tillage.', NULL),
  ('Row Crop Farming', 'WEOC', 100, 300, 'Medium', 'Biological activity is moderate.', NULL),
  ('Row Crop Farming', 'WEOC', 300, NULL, 'High', 'Biological activity is strong; soil biology is healthy.', NULL),
  ('Row Crop Farming', 'Organic_Matter', NULL, 2.5, 'Low', 'Organic matter is low; humic acid or compost application recommended.', 'Humic Acid Soil Conditioner'),
  ('Row Crop Farming', 'Organic_Matter', 2.5, 5, 'Medium', 'Organic matter is in a healthy range.', NULL),
  ('Row Crop Farming', 'Organic_Matter', 5, NULL, 'High', 'Organic matter is excellent.', NULL),
  ('Food Plot / Wildlife', 'Soil_pH', NULL, 6.0, 'Low', 'Lime is strongly recommended — most food plot forages need pH 6.0+.', 'Ag Lime Pallet'),
  ('Food Plot / Wildlife', 'Soil_pH', 6.0, 7.5, 'Medium', 'pH is suitable for clover, brassicas, and most forage mixes.', NULL),
  ('Food Plot / Wildlife', 'Soil_pH', 7.5, NULL, 'High', 'Soil is alkaline; select forage varieties tolerant of high pH.', NULL),
  ('Food Plot / Wildlife', 'Ca_Sat', NULL, 60, 'Low', 'Calcium saturation is low; lime application will also help raise Ca levels.', 'Ag Lime Pallet'),
  ('Food Plot / Wildlife', 'Ca_Sat', 60, 80, 'Medium', 'Calcium saturation is adequate.', NULL),
  ('Food Plot / Wildlife', 'Ca_Sat', 80, NULL, 'High', 'Calcium saturation is high.', NULL),
  ('Food Plot / Wildlife', 'H3A_K', NULL, 100, 'Low', 'Potassium is deficient for forage growth; apply potash.', 'Potash 0-0-60'),
  ('Food Plot / Wildlife', 'H3A_K', 100, 250, 'Medium', 'Potassium levels are adequate for forage.', NULL),
  ('Food Plot / Wildlife', 'H3A_K', 250, NULL, 'High', 'Potassium is sufficient.', NULL)
) AS v(usage_name, metric_key, band_low, band_high, band_label, recommendation_text, product_name)
JOIN usages u ON u.name = v.usage_name
JOIN metrics m ON m.key = v.metric_key
LEFT JOIN products p ON p.name = v.product_name
WHERE NOT EXISTS (
  SELECT 1 FROM rules r WHERE r.usage_id = u.id AND r.metric_id = m.id AND r.band_label = v.band_label
);

-- ===== column_aliases =====
-- header_text values are already normalized (lowercase, punctuation stripped)
-- to match lib/columnMatch.js's normalizeHeader().

INSERT INTO column_aliases (header_text, metric_key, confirmed) VALUES
  ('sample id', 'sample_id', 1),
  ('field id', 'sample_id', 1),
  ('ph', 'Soil_pH', 1),
  ('soil ph', 'Soil_pH', 1),
  ('1 1 soil ph', 'Soil_pH', 1),
  ('h3a p', 'H3A_P', 1),
  ('p h3a', 'H3A_P', 1),
  ('h3a inorganic phosphorus', 'H3A_P', 1),
  ('h3a k', 'H3A_K', 1),
  ('k h3a', 'H3A_K', 1),
  ('h3a icap potassium', 'H3A_K', 1),
  ('weoc', 'WEOC', 1),
  ('h2o total organic c', 'WEOC', 1),
  ('weon', 'WEON', 1),
  ('h2o organic n', 'WEON', 1),
  ('cec', 'CEC', 1),
  ('ca sat', 'Ca_Sat', 1),
  ('ca saturation', 'Ca_Sat', 1),
  ('mg sat', 'Mg_Sat', 1),
  ('k ca ratio', 'K_Ca_ratio', 1),
  ('organic matter', 'Organic_Matter', 1),
  ('om', 'Organic_Matter', 1),
  ('soil health score', 'Soil_Health_Score', 1),
  ('soil health calculation', 'Soil_Health_Score', 1),
  ('wdrf buffer', 'WDRF_Buffer', 1),
  ('1 1 soluble salt', 'Soluble_Salt', 1),
  ('excess lime', 'Excess_Lime', 1),
  ('co2 c', 'CO2_C', 1),
  ('h2o total n', 'H2O_Total_N', 1),
  ('h3a nitrate', 'H3A_Nitrate', 1),
  ('h3a ammonium', 'H3A_Ammonium', 1),
  ('h3a inorganic nitrogen', 'H3A_Inorganic_N', 1),
  ('h3a total phosphorus', 'H3A_Total_P', 1),
  ('h3a organic phosphorus', 'H3A_Organic_P', 1),
  ('h3a icap calcium', 'H3A_Ca', 1),
  ('h3a icap aluminum', 'H3A_Al', 1),
  ('h3a icap iron', 'H3A_Fe', 1),
  ('h3a icap sulfur', 'H3A_S', 1),
  ('h3a icap zinc', 'H3A_Zn', 1),
  ('h3a icap manganese', 'H3A_Mn', 1),
  ('h3a icap copper', 'H3A_Cu', 1),
  ('h3a icap magnesium', 'H3A_Mg', 1),
  ('h3a icap sodium', 'H3A_Na', 1),
  ('mac', 'MAC_Pct', 1),
  ('organic c n', 'Organic_CN_Ratio', 1),
  ('organic n inorganic n', 'Organic_Inorganic_N_Ratio', 1),
  ('organic n release', 'Organic_N_Release', 1),
  ('organic n reserve', 'Organic_N_Reserve', 1),
  ('organic p release', 'Organic_P_Release', 1),
  ('organic p reserve', 'Organic_P_Reserve', 1),
  ('available n', 'Available_N', 1),
  ('available p', 'Available_P', 1),
  ('available k', 'Available_K', 1),
  ('nutrient value', 'Nutrient_Value', 1),
  ('traditional n', 'Traditional_N', 1),
  ('haney test n', 'Haney_Test_N', 1),
  ('lbs n difference', 'Lbs_N_Difference', 1),
  ('n savings', 'N_Savings', 1),
  ('cust id', '_ignore', 1),
  ('name', '_ignore', 1),
  ('company', '_ignore', 1),
  ('address 1', '_ignore', 1),
  ('city', '_ignore', 1),
  ('st', '_ignore', 1),
  ('zip', '_ignore', 1),
  ('date recd', '_ignore', 1),
  ('date rept', '_ignore', 1),
  ('lab no', '_ignore', 1),
  ('grower', '_ignore', 1),
  ('cover crop mix', '_ignore', 1),
  ('beginning depth', '_ignore', 1),
  ('ending depth', '_ignore', 1)
ON CONFLICT (header_text) DO UPDATE SET metric_key = EXCLUDED.metric_key, confirmed = 1;
