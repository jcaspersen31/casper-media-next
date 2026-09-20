import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/apiAuth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request) {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;
  const { user } = auth;

  const body = await request.json();
  const { email, name, company, currentPassword, newPassword } = body || {};
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const existing = await db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, user.id);
  if (existing) {
    return NextResponse.json({ error: "Another account already uses that email." }, { status: 409 });
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    const row = await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id);
    if (!currentPassword || !verifyPassword(currentPassword, row.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
    await db
      .prepare("UPDATE users SET email = ?, name = ?, company = ?, password_hash = ? WHERE id = ?")
      .run(email, name || null, company || null, hashPassword(newPassword), user.id);
  } else {
    await db
      .prepare("UPDATE users SET email = ?, name = ?, company = ? WHERE id = ?")
      .run(email, name || null, company || null, user.id);
  }

  const row = await db.prepare("SELECT id, role, email, name, company FROM users WHERE id = ?").get(user.id);
  return NextResponse.json({ user: row });
}
