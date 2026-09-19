import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const rows = await db
    .prepare(
      `SELECT rt.*, u.name as usage_name FROM report_templates rt JOIN usages u ON u.id = rt.usage_id ORDER BY u.name`
    )
    .all();
  return NextResponse.json({ report_templates: rows });
}

export async function POST(request) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const body = await request.json();
  const { usage_id, sections } = body;
  if (!usage_id) {
    return NextResponse.json({ error: "usage_id is required." }, { status: 400 });
  }
  const existing = await db.prepare("SELECT id FROM report_templates WHERE usage_id = ?").get(Number(usage_id));
  if (existing) {
    return NextResponse.json({ error: "A template already exists for this usage. Edit it instead." }, { status: 409 });
  }
  const info = await db
    .prepare("INSERT INTO report_templates (usage_id, sections) VALUES (?,?)")
    .run(Number(usage_id), JSON.stringify(sections || []));
  const row = await db.prepare("SELECT * FROM report_templates WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ report_template: row }, { status: 201 });
}
