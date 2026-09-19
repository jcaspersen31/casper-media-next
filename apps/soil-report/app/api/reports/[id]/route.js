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

  const samples = await db.prepare("SELECT id, sample_id, raw_values FROM samples WHERE report_id = ?").all(report.id);

  return NextResponse.json({
    report: {
      ...report,
      flagged_columns: JSON.parse(report.flagged_columns || "[]"),
      auto_matched_columns: JSON.parse(report.auto_matched_columns || "[]"),
      assembled_data: report.assembled_data ? JSON.parse(report.assembled_data) : null,
    },
    samples: samples.map((s) => ({ ...s, raw_values: JSON.parse(s.raw_values) })),
  });
}

// Lets a customer remove a faulty import (wrong file, bad parse) and start
// over, or an admin clean up any report. Cascades to that report's samples
// and payments.
export async function DELETE(request, { params }) {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  const report = await loadReportForUser(Number(id), auth.user);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (report === "forbidden") return NextResponse.json({ error: "Not your report." }, { status: 403 });

  await db.prepare("DELETE FROM reports WHERE id = ?").run(report.id);
  return NextResponse.json({ ok: true });
}
