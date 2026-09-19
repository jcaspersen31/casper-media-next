import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const rows = db.prepare("SELECT * FROM lab_profiles ORDER BY lab_name").all();
  return NextResponse.json({ lab_profiles: rows });
}

export async function POST(request) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const body = await request.json();
  const { lab_name, source_type, column_map } = body;
  if (!lab_name || !source_type) {
    return NextResponse.json({ error: "lab_name and source_type are required." }, { status: 400 });
  }
  const info = db
    .prepare("INSERT INTO lab_profiles (lab_name, source_type, column_map) VALUES (?,?,?)")
    .run(lab_name, source_type, JSON.stringify(column_map || {}));
  const row = db.prepare("SELECT * FROM lab_profiles WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ lab_profile: row }, { status: 201 });
}
