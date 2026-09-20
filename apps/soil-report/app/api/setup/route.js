import { NextResponse } from "next/server";
import { execRaw } from "@/lib/db";
import { SETUP_SQL } from "@/lib/setupSql";

// One-time database bootstrap for environments where a web-based SQL editor
// (e.g. Railway's Query tab) can't reliably run a script this size. Visit
// this URL once with the right key (?key=<SETUP_SECRET>) to create the
// schema and demo data; every statement is idempotent, so re-running is
// harmless. Remove SETUP_SECRET (or this route) once you no longer need it.
export async function GET(request) {
  const key = request.nextUrl.searchParams.get("key");
  const expected = process.env.SETUP_SECRET;

  if (!expected) {
    return NextResponse.json({ error: "SETUP_SECRET is not configured." }, { status: 500 });
  }
  if (key !== expected) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  try {
    await execRaw(SETUP_SQL);
    return NextResponse.json({ ok: true, message: "Schema and demo data applied." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
