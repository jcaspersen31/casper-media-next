import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { normalizeHeader } from "@/lib/columnMatch";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const rows = db.prepare("SELECT * FROM column_aliases ORDER BY confirmed, metric_key, header_text").all();
  return NextResponse.json({ column_aliases: rows });
}

export async function POST(request) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const body = await request.json();
  const header_text = normalizeHeader(body.header_text || "");
  const metric_key = body.metric_key;
  if (!header_text || !metric_key) {
    return NextResponse.json({ error: "header_text and metric_key are required." }, { status: 400 });
  }
  const info = db
    .prepare("INSERT INTO column_aliases (header_text, metric_key, confirmed) VALUES (?,?,1)")
    .run(header_text, metric_key);
  const row = db.prepare("SELECT * FROM column_aliases WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ column_alias: row }, { status: 201 });
}
