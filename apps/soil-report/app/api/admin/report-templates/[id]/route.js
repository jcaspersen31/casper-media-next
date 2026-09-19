import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

export async function PUT(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  const body = await request.json();
  const { sections } = body;
  db.prepare("UPDATE report_templates SET sections = ? WHERE id = ?").run(
    JSON.stringify(sections || []),
    Number(id)
  );
  const row = db.prepare("SELECT * FROM report_templates WHERE id = ?").get(Number(id));
  return NextResponse.json({ report_template: row });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  db.prepare("DELETE FROM report_templates WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
