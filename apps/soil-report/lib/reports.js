import { db } from "./db";

export function loadReportForUser(reportId, user) {
  const report = db
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
