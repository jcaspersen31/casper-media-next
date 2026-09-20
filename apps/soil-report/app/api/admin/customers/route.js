import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;

  const rows = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.company, u.created_at, COUNT(r.id)::int as report_count
       FROM users u
       LEFT JOIN reports r ON r.customer_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )
    .all();
  return NextResponse.json({ customers: rows });
}

export async function POST(request) {
  const auth = await requireAdminOrResponse();
  if (auth.response) return auth.response;

  const body = await request.json();
  const { email, password, name, company } = body || {};
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const password_hash = hashPassword(password);
  const info = await db
    .prepare("INSERT INTO users (role, email, password_hash, name, company) VALUES ('customer',?,?,?,?)")
    .run(email, password_hash, name || null, company || null);
  const row = await db
    .prepare("SELECT id, email, name, company, created_at FROM users WHERE id = ?")
    .get(info.lastInsertRowid);
  return NextResponse.json({ customer: row }, { status: 201 });
}
