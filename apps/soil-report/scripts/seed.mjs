// One-time / idempotent seed for local demo data.
// Usage: npm run seed
import bcrypt from "bcryptjs";
import { db } from "../lib/db.js";
import { normalizeHeader } from "../lib/columnMatch.js";

function upsertUser({ role, email, password, name, company }) {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return existing.id;
  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      "INSERT INTO users (role, email, password_hash, name, company) VALUES (?,?,?,?,?)"
    )
    .run(role, email, password_hash, name, company);
  return info.lastInsertRowid;
}

function upsertMetric(key, display_name, unit) {
  const existing = db.prepare("SELECT id FROM metrics WHERE key = ?").get(key);
  if (existing) return existing.id;
  return db
    .prepare("INSERT INTO metrics (key, display_name, unit) VALUES (?,?,?)")
    .run(key, display_name, unit).lastInsertRowid;
}

function upsertUsage(name, description) {
  const existing = db.prepare("SELECT id FROM usages WHERE name = ?").get(name);
  if (existing) return existing.id;
  return db
    .prepare("INSERT INTO usages (name, description) VALUES (?,?)")
    .run(name, description).lastInsertRowid;
}

function upsertProduct(name, store_url, category) {
  const existing = db.prepare("SELECT id FROM products WHERE name = ?").get(name);
  if (existing) return existing.id;
  return db
    .prepare("INSERT INTO products (name, store_url, category) VALUES (?,?,?)")
    .run(name, store_url, category).lastInsertRowid;
}

console.log("Seeding soil-report demo data...");

const adminId = upsertUser({
  role: "admin",
  email: "admin@caspermediallc.com",
  password: "admin1234",
  name: "Demo Admin",
  company: "Casper Media LLC",
});

const customerId = upsertUser({
  role: "customer",
  email: "customer@example.com",
  password: "customer1234",
  name: "Demo Customer",
  company: "Example Farms",
});

const metrics = {
  Soil_pH: upsertMetric("Soil_pH", "Soil pH", ""),
  H3A_P: upsertMetric("H3A_P", "Phosphorus (H3A)", "ppm"),
  H3A_K: upsertMetric("H3A_K", "Potassium (H3A)", "ppm"),
  WEOC: upsertMetric("WEOC", "Water Extractable Organic Carbon", "ppm"),
  WEON: upsertMetric("WEON", "Water Extractable Organic Nitrogen", "ppm"),
  CEC: upsertMetric("CEC", "Cation Exchange Capacity", "meq/100g"),
  Ca_Sat: upsertMetric("Ca_Sat", "Calcium Saturation", "%"),
  Mg_Sat: upsertMetric("Mg_Sat", "Magnesium Saturation", "%"),
  K_Ca_ratio: upsertMetric("K_Ca_ratio", "K:Ca Ratio", ""),
  Organic_Matter: upsertMetric("Organic_Matter", "Organic Matter", "%"),
  Soil_Health_Score: upsertMetric("Soil_Health_Score", "Soil Health Score", ""),
};

const usages = {
  rowCrop: upsertUsage(
    "Row Crop Farming",
    "Commodity row crops such as corn and soybeans."
  ),
  foodPlot: upsertUsage(
    "Food Plot / Wildlife",
    "Food plots and wildlife forage management."
  ),
};

const products = {
  limestone: upsertProduct("Ag Lime Pallet", "https://example-store.com/products/ag-lime", "lime"),
  mapFert: upsertProduct("MAP Starter Fertilizer", "https://example-store.com/products/map-fertilizer", "fertilizer"),
  potash: upsertProduct("Potash 0-0-60", "https://example-store.com/products/potash", "fertilizer"),
  humicAcid: upsertProduct("Humic Acid Soil Conditioner", "https://example-store.com/products/humic-acid", "soil_amendment"),
  coolSeasonMix: upsertProduct("Clover & Brassica Cool Season Mix", "https://example-store.com/products/cool-season-mix", "cool_season_seed"),
  warmSeasonMix: upsertProduct("Sunflower & Sorghum Warm Season Mix", "https://example-store.com/products/warm-season-mix", "warm_season_seed"),
};

// report_templates: which sections render for each usage, in order.
function upsertTemplate(usage_id, sections) {
  const existing = db
    .prepare("SELECT id FROM report_templates WHERE usage_id = ?")
    .get(usage_id);
  const json = JSON.stringify(sections);
  if (existing) {
    db.prepare("UPDATE report_templates SET sections = ? WHERE id = ?").run(json, existing.id);
    return existing.id;
  }
  return db
    .prepare("INSERT INTO report_templates (usage_id, sections) VALUES (?,?)")
    .run(usage_id, json).lastInsertRowid;
}

upsertTemplate(usages.rowCrop, ["biology_narrative", "crop_fertilizer_table"]);
upsertTemplate(usages.foodPlot, [
  "lime_recommendation",
  "cool_season_mix",
  "warm_season_mix",
  "seasonal_nutrient_table",
]);

// rules: band thresholds per usage/metric. Demo numbers only — client to confirm real thresholds.
function upsertRule(usage_id, metric_id, band_low, band_high, band_label, recommendation_text, product_id) {
  const existing = db
    .prepare(
      "SELECT id FROM rules WHERE usage_id = ? AND metric_id = ? AND band_label = ?"
    )
    .get(usage_id, metric_id, band_label);
  if (existing) return existing.id;
  return db
    .prepare(
      `INSERT INTO rules (usage_id, metric_id, band_low, band_high, band_label, recommendation_text, product_id)
       VALUES (?,?,?,?,?,?,?)`
    )
    .run(usage_id, metric_id, band_low, band_high, band_label, recommendation_text, product_id ?? null).lastInsertRowid;
}

// Row Crop rules
upsertRule(usages.rowCrop, metrics.Soil_pH, null, 5.8, "Low", "Soil is acidic; lime is recommended before planting.", products.limestone);
upsertRule(usages.rowCrop, metrics.Soil_pH, 5.8, 7.2, "Medium", "pH is in an acceptable range for most row crops.", null);
upsertRule(usages.rowCrop, metrics.Soil_pH, 7.2, null, "High", "Soil is alkaline; monitor micronutrient availability.", null);

upsertRule(usages.rowCrop, metrics.H3A_P, null, 15, "Low", "Phosphorus is deficient; apply a starter fertilizer at planting.", products.mapFert);
upsertRule(usages.rowCrop, metrics.H3A_P, 15, 40, "Medium", "Phosphorus levels are adequate.", null);
upsertRule(usages.rowCrop, metrics.H3A_P, 40, null, "High", "Phosphorus is in excess; reduce applications.", null);

upsertRule(usages.rowCrop, metrics.H3A_K, null, 100, "Low", "Potassium is deficient; apply potash to correct.", products.potash);
upsertRule(usages.rowCrop, metrics.H3A_K, 100, 250, "Medium", "Potassium levels are adequate.", null);
upsertRule(usages.rowCrop, metrics.H3A_K, 250, null, "High", "Potassium is sufficient to excessive.", null);

upsertRule(usages.rowCrop, metrics.WEOC, null, 100, "Low", "Low biological activity; consider a cover crop and reduced tillage.", null);
upsertRule(usages.rowCrop, metrics.WEOC, 100, 300, "Medium", "Biological activity is moderate.", null);
upsertRule(usages.rowCrop, metrics.WEOC, 300, null, "High", "Biological activity is strong; soil biology is healthy.", null);

upsertRule(usages.rowCrop, metrics.Organic_Matter, null, 2.5, "Low", "Organic matter is low; humic acid or compost application recommended.", products.humicAcid);
upsertRule(usages.rowCrop, metrics.Organic_Matter, 2.5, 5, "Medium", "Organic matter is in a healthy range.", null);
upsertRule(usages.rowCrop, metrics.Organic_Matter, 5, null, "High", "Organic matter is excellent.", null);

// Food Plot / Wildlife rules
upsertRule(usages.foodPlot, metrics.Soil_pH, null, 6.0, "Low", "Lime is strongly recommended — most food plot forages need pH 6.0+.", products.limestone);
upsertRule(usages.foodPlot, metrics.Soil_pH, 6.0, 7.5, "Medium", "pH is suitable for clover, brassicas, and most forage mixes.", null);
upsertRule(usages.foodPlot, metrics.Soil_pH, 7.5, null, "High", "Soil is alkaline; select forage varieties tolerant of high pH.", null);

upsertRule(usages.foodPlot, metrics.Ca_Sat, null, 60, "Low", "Calcium saturation is low; lime application will also help raise Ca levels.", products.limestone);
upsertRule(usages.foodPlot, metrics.Ca_Sat, 60, 80, "Medium", "Calcium saturation is adequate.", null);
upsertRule(usages.foodPlot, metrics.Ca_Sat, 80, null, "High", "Calcium saturation is high.", null);

upsertRule(usages.foodPlot, metrics.H3A_K, null, 100, "Low", "Potassium is deficient for forage growth; apply potash.", products.potash);
upsertRule(usages.foodPlot, metrics.H3A_K, 100, 250, "Medium", "Potassium levels are adequate for forage.", null);
upsertRule(usages.foodPlot, metrics.H3A_K, 250, null, "High", "Potassium is sufficient.", null);

// column_aliases: global source-header -> canonical metric key matching,
// confirmed=1 since these are admin-entered. Every uploaded report resolves
// its columns against this table regardless of which lab it came from —
// customers never pick a lab/format. Unrecognized headers fall back to
// fuzzy matching (which learns new aliases automatically) and, failing
// that, show up flagged for admin review.
function upsertAlias(header_text, metric_key) {
  const normalized = normalizeHeader(header_text);
  const existing = db.prepare("SELECT id FROM column_aliases WHERE header_text = ?").get(normalized);
  if (existing) {
    db.prepare("UPDATE column_aliases SET metric_key = ?, confirmed = 1 WHERE id = ?").run(metric_key, existing.id);
    return existing.id;
  }
  return db
    .prepare("INSERT INTO column_aliases (header_text, metric_key, confirmed) VALUES (?,?,1)")
    .run(normalized, metric_key).lastInsertRowid;
}

const genericAliases = {
  "Sample ID": "sample_id",
  "Field ID": "sample_id",
  "pH": "Soil_pH",
  "soil pH": "Soil_pH",
  "1:1 Soil pH": "Soil_pH",
  "H3A-P": "H3A_P",
  "P (H3A)": "H3A_P",
  "H3A Inorganic Phosphorus": "H3A_P",
  "H3A-K": "H3A_K",
  "K (H3A)": "H3A_K",
  "H3A ICAP Potassium": "H3A_K",
  "WEOC": "WEOC",
  "H2O Total Organic C": "WEOC",
  "WEON": "WEON",
  "H2O Organic N": "WEON",
  "CEC": "CEC",
  "%Ca Sat": "Ca_Sat",
  "Ca Saturation": "Ca_Sat",
  "%Mg Sat": "Mg_Sat",
  "K:Ca Ratio": "K_Ca_ratio",
  "Organic Matter": "Organic_Matter",
  "OM %": "Organic_Matter",
  "Soil Health Score": "Soil_Health_Score",
  "Soil Health Calculation": "Soil_Health_Score",
};

for (const [header, metricKey] of Object.entries(genericAliases)) {
  upsertAlias(header, metricKey);
}

console.log("Seed complete.");
console.log("Admin login:    admin@caspermediallc.com / admin1234");
console.log("Customer login: customer@example.com / customer1234");
