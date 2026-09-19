import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

export async function PUT(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  const body = await request.json();
  const { lab_name, source_type, column_map } = body;
  db.prepare("UPDATE lab_profiles SET lab_name = ?, source_type = ?, column_map = ? WHERE id = ?").run(
    lab_name,
    source_type,
    JSON.stringify(column_map || {}),
    Number(id)
  );
  const row = db.prepare("SELECT * FROM lab_profiles WHERE id = ?").get(Number(id));
  return NextResponse.json({ lab_profile: row });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  db.prepare("DELETE FROM lab_profiles WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
