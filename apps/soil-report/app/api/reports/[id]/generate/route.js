import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/apiAuth";
import { loadReportForUser } from "@/lib/reports";
import { assembleReportData } from "@/lib/rulesEngine";
import { db } from "@/lib/db";

export async function POST(request, { params }) {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  const report = await loadReportForUser(Number(id), auth.user);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (report === "forbidden") return NextResponse.json({ error: "Not your report." }, { status: 403 });

  if (report.status === "uploaded") {
    return NextResponse.json({ error: "Payment is required before generating the report." }, { status: 402 });
  }

  const assembled = await assembleReportData(report.id);
  await db.prepare("UPDATE reports SET status = 'generated', assembled_data = ? WHERE id = ?").run(
    JSON.stringify(assembled),
    report.id
  );

  return NextResponse.json({ ok: true, assembled });
}
