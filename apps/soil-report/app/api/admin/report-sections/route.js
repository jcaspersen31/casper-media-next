import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const VALID_TYPES = ["metric_table", "narrative", "product_list"];

export async function GET() {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;
  const rows = await db.prepare("SELECT * FROM report_sections ORDER BY title").all();
  return NextResponse.json({ report_sections: rows });
}

export async function POST(request) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;

  const body = await request.json();
  const { title, type, intro_text, metric_keys, sentence_template, product_category } = body || {};

  if (!title || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Title and a valid type are required." }, { status: 400 });
  }

  let key = slugify(title);
  if (!key) {
    return NextResponse.json({ error: "Title must contain at least one letter or number." }, { status: 400 });
  }
  const existing = await db.prepare("SELECT id FROM report_sections WHERE key = ?").get(key);
  if (existing) key = `${key}_${Date.now().toString(36)}`;

  const info = await db
    .prepare(
      `INSERT INTO report_sections (key, title, type, intro_text, metric_keys, sentence_template, product_category)
       VALUES (?,?,?,?,?,?,?)`
    )
    .run(
      key,
      title,
      type,
      intro_text || null,
      metric_keys?.length ? JSON.stringify(metric_keys) : null,
      sentence_template || null,
      product_category || null
    );

  const row = await db.prepare("SELECT * FROM report_sections WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ report_section: row }, { status: 201 });
}
