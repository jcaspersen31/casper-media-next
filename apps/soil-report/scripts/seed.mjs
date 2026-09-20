// One-time / idempotent seed for local demo data.
// Usage: npm run seed  (after `npm run migrate`)
import bcrypt from "bcryptjs";
import { db } from "../lib/db.js";
import { normalizeHeader } from "../lib/columnMatch.js";

async function upsertUser({ role, email, password, name, company }) {
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return existing.id;
  const password_hash = bcrypt.hashSync(password, 10);
  const info = await db
    .prepare(
      "INSERT INTO users (role, email, password_hash, name, company) VALUES (?,?,?,?,?)"
    )
    .run(role, email, password_hash, name, company);
  return info.lastInsertRowid;
}

async function upsertMetric(key, display_name, unit) {
  const existing = await db.prepare("SELECT id FROM metrics WHERE key = ?").get(key);
  if (existing) return existing.id;
  const info = await db
    .prepare("INSERT INTO metrics (key, display_name, unit) VALUES (?,?,?)")
    .run(key, display_name, unit);
  return info.lastInsertRowid;
}

async function upsertUsage(name, description) {
  const existing = await db.prepare("SELECT id FROM usages WHERE name = ?").get(name);
  if (existing) return existing.id;
  const info = await db.prepare("INSERT INTO usages (name, description) VALUES (?,?)").run(name, description);
  return info.lastInsertRowid;
}

async function upsertProduct(name, store_url, category) {
  const existing = await db.prepare("SELECT id FROM products WHERE name = ?").get(name);
  if (existing) return existing.id;
  const info = await db
    .prepare("INSERT INTO products (name, store_url, category) VALUES (?,?,?)")
    .run(name, store_url, category);
  return info.lastInsertRowid;
}

// report_templates: which sections render for each usage, in order.
async function upsertTemplate(usage_id, sections) {
  const existing = await db.prepare("SELECT id FROM report_templates WHERE usage_id = ?").get(usage_id);
  const json = JSON.stringify(sections);
  if (existing) {
    await db.prepare("UPDATE report_templates SET sections = ? WHERE id = ?").run(json, existing.id);
    return existing.id;
  }
  const info = await db.prepare("INSERT INTO report_templates (usage_id, sections) VALUES (?,?)").run(usage_id, json);
  return info.lastInsertRowid;
}

// rules: band thresholds per usage/metric. Demo numbers only — client to confirm real thresholds.
async function upsertRule(usage_id, metric_id, band_low, band_high, band_label, recommendation_text, product_id) {
  const existing = await db
    .prepare("SELECT id FROM rules WHERE usage_id = ? AND metric_id = ? AND band_label = ?")
    .get(usage_id, metric_id, band_label);
  if (existing) return existing.id;
  const info = await db
    .prepare(
      `INSERT INTO rules (usage_id, metric_id, band_low, band_high, band_label, recommendation_text, product_id)
       VALUES (?,?,?,?,?,?,?)`
    )
    .run(usage_id, metric_id, band_low, band_high, band_label, recommendation_text, product_id ?? null);
  return info.lastInsertRowid;
}

// column_aliases: global source-header -> canonical metric key matching,
// confirmed=1 since these are admin-entered. Every uploaded report resolves
// its columns against this table regardless of which lab it came from —
// customers never pick a lab/format. Unrecognized headers fall back to
// fuzzy matching (which learns new aliases automatically) and, failing
// that, show up flagged for admin review.
async function upsertAlias(header_text, metric_key) {
  const normalized = normalizeHeader(header_text);
  const existing = await db.prepare("SELECT id FROM column_aliases WHERE header_text = ?").get(normalized);
  if (existing) {
    await db.prepare("UPDATE column_aliases SET metric_key = ?, confirmed = 1 WHERE id = ?").run(metric_key, existing.id);
    return existing.id;
  }
  const info = await db
    .prepare("INSERT INTO column_aliases (header_text, metric_key, confirmed) VALUES (?,?,1)")
    .run(normalized, metric_key);
  return info.lastInsertRowid;
}

console.log("Seeding soil-report demo data...");

await upsertUser({
  role: "admin",
  email: "admin@caspermediallc.com",
  password: "admin1234",
  name: "Demo Admin",
  company: "Casper Media LLC",
});

await upsertUser({
  role: "customer",
  email: "customer@example.com",
  password: "customer1234",
  name: "Demo Customer",
  company: "Example Farms",
});

const metrics = {
  Soil_pH: await upsertMetric("Soil_pH", "Soil pH", ""),
  H3A_P: await upsertMetric("H3A_P", "Phosphorus (H3A)", "ppm"),
  H3A_K: await upsertMetric("H3A_K", "Potassium (H3A)", "ppm"),
  WEOC: await upsertMetric("WEOC", "Water Extractable Organic Carbon", "ppm"),
  WEON: await upsertMetric("WEON", "Water Extractable Organic Nitrogen", "ppm"),
  CEC: await upsertMetric("CEC", "Cation Exchange Capacity", "meq/100g"),
  Ca_Sat: await upsertMetric("Ca_Sat", "Calcium Saturation", "%"),
  Mg_Sat: await upsertMetric("Mg_Sat", "Magnesium Saturation", "%"),
  K_Ca_ratio: await upsertMetric("K_Ca_ratio", "K:Ca Ratio", ""),
  Organic_Matter: await upsertMetric("Organic_Matter", "Organic Matter", "%"),
  Soil_Health_Score: await upsertMetric("Soil_Health_Score", "Soil Health Score", ""),
};

// Additional metrics seen on real Haney-test exports that we capture but
// don't have rules for yet — they'll stop showing as "flagged" on upload,
// but won't appear in any report section until an admin adds real
// threshold rules for them (see /admin/rules). Not fabricating agronomic
// thresholds here — see SPEC.md's open items.
await upsertMetric("WDRF_Buffer", "WDRF Buffer pH", "");
await upsertMetric("Soluble_Salt", "Soluble Salt (1:1)", "mmhos/cm");
await upsertMetric("Excess_Lime", "Excess Lime", "");
await upsertMetric("CO2_C", "CO2-C Respiration", "ppm");
await upsertMetric("H2O_Total_N", "Water Extractable Total N", "ppm");
await upsertMetric("H3A_Nitrate", "Nitrate (H3A)", "ppm");
await upsertMetric("H3A_Ammonium", "Ammonium (H3A)", "ppm");
await upsertMetric("H3A_Inorganic_N", "Inorganic Nitrogen (H3A)", "ppm");
await upsertMetric("H3A_Total_P", "Total Phosphorus (H3A)", "ppm");
await upsertMetric("H3A_Organic_P", "Organic Phosphorus (H3A)", "ppm");
await upsertMetric("H3A_Ca", "Calcium (H3A)", "ppm");
await upsertMetric("H3A_Al", "Aluminum (H3A)", "ppm");
await upsertMetric("H3A_Fe", "Iron (H3A)", "ppm");
await upsertMetric("H3A_S", "Sulfur (H3A)", "ppm");
await upsertMetric("H3A_Zn", "Zinc (H3A)", "ppm");
await upsertMetric("H3A_Mn", "Manganese (H3A)", "ppm");
await upsertMetric("H3A_Cu", "Copper (H3A)", "ppm");
await upsertMetric("H3A_Mg", "Magnesium (H3A)", "ppm");
await upsertMetric("H3A_Na", "Sodium (H3A)", "ppm");
await upsertMetric("MAC_Pct", "Microbially Active Carbon", "%");
await upsertMetric("Organic_CN_Ratio", "Organic C:N Ratio", "");
await upsertMetric("Organic_Inorganic_N_Ratio", "Organic N : Inorganic N Ratio", "");
await upsertMetric("Organic_N_Release", "Organic N Release", "lbs/ac");
await upsertMetric("Organic_N_Reserve", "Organic N Reserve", "lbs/ac");
await upsertMetric("Organic_P_Release", "Organic P Release", "lbs/ac");
await upsertMetric("Organic_P_Reserve", "Organic P Reserve", "lbs/ac");
await upsertMetric("Available_N", "Available N", "lbs/ac");
await upsertMetric("Available_P", "Available P", "lbs/ac");
await upsertMetric("Available_K", "Available K", "lbs/ac");
await upsertMetric("Nutrient_Value", "Nutrient Value", "$/ac");
await upsertMetric("Traditional_N", "Traditional N Recommendation", "lbs/ac");
await upsertMetric("Haney_Test_N", "Haney Test N Recommendation", "lbs/ac");
await upsertMetric("Lbs_N_Difference", "N Recommendation Difference", "lbs/ac");
await upsertMetric("N_Savings", "N Savings", "$/ac");

const usages = {
  rowCrop: await upsertUsage("Row Crop Farming", "Commodity row crops such as corn and soybeans."),
  foodPlot: await upsertUsage("Food Plot / Wildlife", "Food plots and wildlife forage management."),
};

const products = {
  limestone: await upsertProduct("Ag Lime Pallet", "https://example-store.com/products/ag-lime", "lime"),
  mapFert: await upsertProduct("MAP Starter Fertilizer", "https://example-store.com/products/map-fertilizer", "fertilizer"),
  potash: await upsertProduct("Potash 0-0-60", "https://example-store.com/products/potash", "fertilizer"),
  humicAcid: await upsertProduct("Humic Acid Soil Conditioner", "https://example-store.com/products/humic-acid", "soil_amendment"),
  coolSeasonMix: await upsertProduct("Clover & Brassica Cool Season Mix", "https://example-store.com/products/cool-season-mix", "cool_season_seed"),
  warmSeasonMix: await upsertProduct("Sunflower & Sorghum Warm Season Mix", "https://example-store.com/products/warm-season-mix", "warm_season_seed"),
};

await upsertTemplate(usages.rowCrop, ["biology_narrative", "crop_fertilizer_table"]);
await upsertTemplate(usages.foodPlot, [
  "lime_recommendation",
  "cool_season_mix",
  "warm_season_mix",
  "seasonal_nutrient_table",
]);

// Row Crop rules
await upsertRule(usages.rowCrop, metrics.Soil_pH, null, 5.8, "Low", "Soil is acidic; lime is recommended before planting.", products.limestone);
await upsertRule(usages.rowCrop, metrics.Soil_pH, 5.8, 7.2, "Medium", "pH is in an acceptable range for most row crops.", null);
await upsertRule(usages.rowCrop, metrics.Soil_pH, 7.2, null, "High", "Soil is alkaline; monitor micronutrient availability.", null);

await upsertRule(usages.rowCrop, metrics.H3A_P, null, 15, "Low", "Phosphorus is deficient; apply a starter fertilizer at planting.", products.mapFert);
await upsertRule(usages.rowCrop, metrics.H3A_P, 15, 40, "Medium", "Phosphorus levels are adequate.", null);
await upsertRule(usages.rowCrop, metrics.H3A_P, 40, null, "High", "Phosphorus is in excess; reduce applications.", null);

await upsertRule(usages.rowCrop, metrics.H3A_K, null, 100, "Low", "Potassium is deficient; apply potash to correct.", products.potash);
await upsertRule(usages.rowCrop, metrics.H3A_K, 100, 250, "Medium", "Potassium levels are adequate.", null);
await upsertRule(usages.rowCrop, metrics.H3A_K, 250, null, "High", "Potassium is sufficient to excessive.", null);

await upsertRule(usages.rowCrop, metrics.WEOC, null, 100, "Low", "Low biological activity; consider a cover crop and reduced tillage.", null);
await upsertRule(usages.rowCrop, metrics.WEOC, 100, 300, "Medium", "Biological activity is moderate.", null);
await upsertRule(usages.rowCrop, metrics.WEOC, 300, null, "High", "Biological activity is strong; soil biology is healthy.", null);

await upsertRule(usages.rowCrop, metrics.Organic_Matter, null, 2.5, "Low", "Organic matter is low; humic acid or compost application recommended.", products.humicAcid);
await upsertRule(usages.rowCrop, metrics.Organic_Matter, 2.5, 5, "Medium", "Organic matter is in a healthy range.", null);
await upsertRule(usages.rowCrop, metrics.Organic_Matter, 5, null, "High", "Organic matter is excellent.", null);

// Food Plot / Wildlife rules
await upsertRule(usages.foodPlot, metrics.Soil_pH, null, 6.0, "Low", "Lime is strongly recommended — most food plot forages need pH 6.0+.", products.limestone);
await upsertRule(usages.foodPlot, metrics.Soil_pH, 6.0, 7.5, "Medium", "pH is suitable for clover, brassicas, and most forage mixes.", null);
await upsertRule(usages.foodPlot, metrics.Soil_pH, 7.5, null, "High", "Soil is alkaline; select forage varieties tolerant of high pH.", null);

await upsertRule(usages.foodPlot, metrics.Ca_Sat, null, 60, "Low", "Calcium saturation is low; lime application will also help raise Ca levels.", products.limestone);
await upsertRule(usages.foodPlot, metrics.Ca_Sat, 60, 80, "Medium", "Calcium saturation is adequate.", null);
await upsertRule(usages.foodPlot, metrics.Ca_Sat, 80, null, "High", "Calcium saturation is high.", null);

await upsertRule(usages.foodPlot, metrics.H3A_K, null, 100, "Low", "Potassium is deficient for forage growth; apply potash.", products.potash);
await upsertRule(usages.foodPlot, metrics.H3A_K, 100, 250, "Medium", "Potassium levels are adequate for forage.", null);
await upsertRule(usages.foodPlot, metrics.H3A_K, 250, null, "High", "Potassium is sufficient.", null);

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

  // Real Haney-test columns we capture but don't have rules for yet.
  "WDRF Buffer": "WDRF_Buffer",
  "1:1 Soluble Salt": "Soluble_Salt",
  "Excess Lime": "Excess_Lime",
  "CO2-C": "CO2_C",
  "H2O Total N": "H2O_Total_N",
  "H3A Nitrate": "H3A_Nitrate",
  "H3A Ammonium": "H3A_Ammonium",
  "H3A Inorganic Nitrogen": "H3A_Inorganic_N",
  "H3A Total Phosphorus": "H3A_Total_P",
  "H3A Organic Phosphorus": "H3A_Organic_P",
  "H3A ICAP Calcium": "H3A_Ca",
  "H3A ICAP Aluminum": "H3A_Al",
  "H3A ICAP Iron": "H3A_Fe",
  "H3A ICAP Sulfur": "H3A_S",
  "H3A ICAP Zinc": "H3A_Zn",
  "H3A ICAP Manganese": "H3A_Mn",
  "H3A ICAP Copper": "H3A_Cu",
  "H3A ICAP Magnesium": "H3A_Mg",
  "H3A ICAP Sodium": "H3A_Na",
  "% MAC": "MAC_Pct",
  "Organic C:N": "Organic_CN_Ratio",
  "Organic N:Inorganic N": "Organic_Inorganic_N_Ratio",
  "Organic N Release": "Organic_N_Release",
  "Organic N Reserve": "Organic_N_Reserve",
  "Organic P Release": "Organic_P_Release",
  "Organic P Reserve": "Organic_P_Reserve",
  "Available N": "Available_N",
  "Available P": "Available_P",
  "Available K": "Available_K",
  "Nutrient Value": "Nutrient_Value",
  "Traditional N": "Traditional_N",
  "Haney Test N": "Haney_Test_N",
  "Lbs N Difference": "Lbs_N_Difference",
  "N savings": "N_Savings",

  // Lab/customer metadata — not a metric, deliberately ignored rather than flagged.
  "Cust ID": "_ignore",
  "Name": "_ignore",
  "Company": "_ignore",
  "Address 1": "_ignore",
  "City": "_ignore",
  "ST": "_ignore",
  "Zip": "_ignore",
  "Date Recd": "_ignore",
  "Date Rept": "_ignore",
  "Lab No": "_ignore",
  "Grower": "_ignore",
  "Cover Crop Mix": "_ignore",
  "Beginning Depth": "_ignore",
  "Ending Depth": "_ignore",
};

for (const [header, metricKey] of Object.entries(genericAliases)) {
  await upsertAlias(header, metricKey);
}

console.log("Seed complete.");
console.log("Admin login:    admin@caspermediallc.com / admin1234");
console.log("Customer login: customer@example.com / customer1234");

process.exit(0);
