import { NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, createSession } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body || {};

  const user = email ? await findUserByEmail(email) : null;
  if (!user || !verifyPassword(password || "", user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user);
  const { password_hash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
