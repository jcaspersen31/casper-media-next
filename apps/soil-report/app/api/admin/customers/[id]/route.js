import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { email, name, company, password } = body || {};
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (password && password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
    .get(email, Number(id));
  if (existing) {
    return NextResponse.json({ error: "Another account already uses that email." }, { status: 409 });
  }

  if (password) {
    await db
      .prepare("UPDATE users SET email = ?, name = ?, company = ?, password_hash = ? WHERE id = ? AND role = 'customer'")
      .run(email, name || null, company || null, hashPassword(password), Number(id));
  } else {
    await db
      .prepare("UPDATE users SET email = ?, name = ?, company = ? WHERE id = ? AND role = 'customer'")
      .run(email, name || null, company || null, Number(id));
  }

  const row = await db
    .prepare("SELECT id, email, name, company, created_at FROM users WHERE id = ?")
    .get(Number(id));
  return NextResponse.json({ customer: row });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  // Cascades to that customer's reports/samples/payments (see schema.sql).
  await db.prepare("DELETE FROM users WHERE id = ? AND role = 'customer'").run(Number(id));
  return NextResponse.json({ ok: true });
}
