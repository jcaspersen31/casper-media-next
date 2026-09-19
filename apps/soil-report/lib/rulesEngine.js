import { db } from "./db";

// Compares one sample's raw metric values against the rules defined for a
// usage, returning one evaluation per metric that has both a value and a
// matching rule.
export function evaluateSample(rawValues, usageId) {
  const metrics = db.prepare("SELECT * FROM metrics").all();
  const rules = db
    .prepare(
      `SELECT r.*, p.name as product_name, p.store_url as product_store_url, p.category as product_category
       FROM rules r
       LEFT JOIN products p ON p.id = r.product_id
       WHERE r.usage_id = ?`
    )
    .all(usageId);

  const results = [];

  for (const metric of metrics) {
    const value = rawValues[metric.key];
    if (value === undefined || value === null || value === "") continue;

    const numValue = Number(value);
    const candidateRules = rules.filter((r) => r.metric_id === metric.id);
    if (candidateRules.length === 0) continue;

    const matched = candidateRules.find((r) => {
      const low = r.band_low === null ? -Infinity : r.band_low;
      const high = r.band_high === null ? Infinity : r.band_high;
      return numValue >= low && numValue < high;
    });

    results.push({
      metricKey: metric.key,
      displayName: metric.display_name,
      unit: metric.unit,
      value: numValue,
      band: matched?.band_label || "Unrated",
      recommendation: matched?.recommendation_text || null,
      product: matched?.product_id
        ? { id: matched.product_id, name: matched.product_name, storeUrl: matched.product_store_url, category: matched.product_category }
        : null,
    });
  }

  return results;
}

// Runs the rules engine for every sample on a report and assembles the data
// each report_templates section needs, ready for both the web view and PDF
// renderers to consume identically.
export function assembleReportData(reportId) {
  const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId);
  if (!report) throw new Error("Report not found.");

  const usage = db.prepare("SELECT * FROM usages WHERE id = ?").get(report.usage_id);
  const template = db.prepare("SELECT * FROM report_templates WHERE usage_id = ?").get(report.usage_id);
  const sections = template ? JSON.parse(template.sections) : [];

  const sampleRows = db.prepare("SELECT * FROM samples WHERE report_id = ?").all(reportId);
  const samples = sampleRows.map((s) => ({
    id: s.id,
    sampleId: s.sample_id,
    evaluations: evaluateSample(JSON.parse(s.raw_values), report.usage_id),
  }));

  const allProducts = db.prepare("SELECT * FROM products").all();

  return {
    reportId: report.id,
    usageName: usage?.name || "General",
    sections,
    samples,
    allProducts,
    generatedAt: new Date().toISOString(),
  };
}
