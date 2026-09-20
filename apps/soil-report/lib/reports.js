import { db } from "./db";

// True if at least one sample on the report has at least one metric that
// resolved to a known column — i.e. there's something for the rules engine
// to actually evaluate. A report where every column was flagged/unmatched
// would otherwise still let a customer pay for a report with nothing in it.
export function hasUsableData(samples) {
  return samples.some((s) => {
    const values = typeof s.raw_values === "string" ? JSON.parse(s.raw_values || "{}") : s.raw_values || {};
    return Object.keys(values).length > 0;
  });
}

export async function loadReportForUser(reportId, user) {
  const report = await db
    .prepare(
      `SELECT r.*, u.name as customer_name, u.email as customer_email, us.name as usage_name
       FROM reports r
       JOIN users u ON u.id = r.customer_id
       LEFT JOIN usages us ON us.id = r.usage_id
       WHERE r.id = ?`
    )
    .get(reportId);
  if (!report) return null;
  if (user.role !== "admin" && report.customer_id !== user.id) return "forbidden";
  return report;
}
