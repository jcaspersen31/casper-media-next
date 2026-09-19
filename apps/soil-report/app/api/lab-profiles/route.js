import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/apiAuth";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;

  const rows = db.prepare("SELECT id, lab_name, source_type FROM lab_profiles ORDER BY lab_name").all();
  return NextResponse.json({ labProfiles: rows });
}
