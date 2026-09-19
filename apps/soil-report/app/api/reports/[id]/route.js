import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/apiAuth";
import { loadReportForUser } from "@/lib/reports";
import { db } from "@/lib/db";

export async function GET(request, { params }) {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  const report = await loadReportForUser(Number(id), auth.user);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (report === "forbidden") return NextResponse.json({ error: "Not your report." }, { status: 403 });

  const samples = db.prepare("SELECT id, sample_id, raw_values FROM samples WHERE report_id = ?").all(report.id);

  return NextResponse.json({
    report: {
      ...report,
      flagged_columns: JSON.parse(report.flagged_columns || "[]"),
      assembled_data: report.assembled_data ? JSON.parse(report.assembled_data) : null,
    },
    samples: samples.map((s) => ({ ...s, raw_values: JSON.parse(s.raw_values) })),
  });
}
