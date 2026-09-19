import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseUpload } from "@/lib/parsers";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
  const rows =
    user.role === "admin"
      ? db
          .prepare(
            `SELECT r.*, u.name as customer_name, u.email as customer_email, us.name as usage_name
             FROM reports r
             JOIN users u ON u.id = r.customer_id
             LEFT JOIN usages us ON us.id = r.usage_id
             ORDER BY r.created_at DESC`
          )
          .all()
      : db
          .prepare(
            `SELECT r.*, us.name as usage_name
             FROM reports r
             LEFT JOIN usages us ON us.id = r.usage_id
             WHERE r.customer_id = ?
             ORDER BY r.created_at DESC`
          )
          .all(user.id);

  return NextResponse.json({ reports: rows });
}

export async function POST(request) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const usageId = formData.get("usage_id");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (!usageId) {
    return NextResponse.json({ error: "Usage is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parseUpload(buffer, file.name);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Could not parse file." }, { status: 422 });
  }

  const insertReport = db.prepare(
    `INSERT INTO reports (customer_id, usage_id, original_filename, status, flagged_columns, auto_matched_columns)
     VALUES (?,?,?, 'uploaded', ?, ?)`
  );
  const info = insertReport.run(
    user.id,
    Number(usageId),
    file.name,
    JSON.stringify(parsed.flaggedColumns),
    JSON.stringify(parsed.autoMatchedColumns)
  );
  const reportId = info.lastInsertRowid;

  const insertSample = db.prepare(
    "INSERT INTO samples (report_id, sample_id, raw_values) VALUES (?,?,?)"
  );
  for (const sample of parsed.samples) {
    insertSample.run(reportId, sample.sample_id, JSON.stringify(sample.raw_values));
  }

  return NextResponse.json({
    report: { id: reportId, status: "uploaded" },
    flaggedColumns: parsed.flaggedColumns,
    autoMatchedColumns: parsed.autoMatchedColumns,
    sampleCount: parsed.samples.length,
  });
}
