import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;

  const rows = await db.prepare("SELECT id, name, description FROM usages ORDER BY name").all();
  return NextResponse.json({ usages: rows });
}
