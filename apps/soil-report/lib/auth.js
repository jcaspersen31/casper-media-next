import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const SESSION_COOKIE = "soil_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export async function createSession(user) {
  const token = await new SignJWT({ sub: String(user.id), role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const user = await db
      .prepare("SELECT id, role, email, name, company FROM users WHERE id = ?")
      .get(Number(payload.sub));
    return user || null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("Not authenticated");
    err.status = 401;
    throw err;
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    const err = new Error("Admin access required");
    err.status = 403;
    throw err;
  }
  return user;
}

export async function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export async function createUser({ role, email, password, name, company }) {
  const password_hash = hashPassword(password);
  const info = await db
    .prepare(
      "INSERT INTO users (role, email, password_hash, name, company) VALUES (?,?,?,?,?)"
    )
    .run(role, email, password_hash, name || null, company || null);
  return db.prepare("SELECT id, role, email, name, company FROM users WHERE id = ?").get(info.lastInsertRowid);
}
