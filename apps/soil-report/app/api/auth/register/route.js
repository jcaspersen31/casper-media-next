import { NextResponse } from "next/server";
import { createUser, createSession, findUserByEmail } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json();
  const { email, password, name, company } = body || {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await createUser({ role: "customer", email, password, name, company });
  await createSession(user);
  return NextResponse.json({ user });
}
