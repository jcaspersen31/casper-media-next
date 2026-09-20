import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

const VALID_TYPES = ["metric_table", "narrative", "product_list"];

// key is intentionally not editable here — report_templates.sections
// references sections by key, so renaming it would silently break every
// template that includes it. Delete and recreate if a key truly needs to change.
export async function PUT(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { title, type, intro_text, metric_keys, sentence_template, product_category } = body || {};

  if (!title || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Title and a valid type are required." }, { status: 400 });
  }

  await db
    .prepare(
      `UPDATE report_sections
       SET title = ?, type = ?, intro_text = ?, metric_keys = ?, sentence_template = ?, product_category = ?
       WHERE id = ?`
    )
    .run(
      title,
      type,
      intro_text || null,
      metric_keys?.length ? JSON.stringify(metric_keys) : null,
      sentence_template || null,
      product_category || null,
      Number(id)
    );

  const row = await db.prepare("SELECT * FROM report_sections WHERE id = ?").get(Number(id));
  return NextResponse.json({ report_section: row });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  await db.prepare("DELETE FROM report_sections WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
