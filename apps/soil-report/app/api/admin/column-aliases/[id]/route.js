import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { normalizeHeader } from "@/lib/columnMatch";
import { db } from "@/lib/db";

export async function PUT(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  const body = await request.json();
  const header_text = normalizeHeader(body.header_text || "");
  const metric_key = body.metric_key;
  // Editing/saving an auto-learned alias is how an admin confirms it.
  await db.prepare("UPDATE column_aliases SET header_text = ?, metric_key = ?, confirmed = 1 WHERE id = ?").run(
    header_text,
    metric_key,
    Number(id)
  );
  const row = await db.prepare("SELECT * FROM column_aliases WHERE id = ?").get(Number(id));
  return NextResponse.json({ column_alias: row });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  await db.prepare("DELETE FROM column_aliases WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
