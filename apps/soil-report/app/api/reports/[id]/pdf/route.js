import { renderToBuffer } from "@react-pdf/renderer";
import { requireUserOrResponse } from "@/lib/apiAuth";
import { loadReportForUser } from "@/lib/reports";
import { buildSectionViewModels } from "@/lib/renderSections";
import { SoilReportDocument } from "@/lib/pdfDocument";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  const report = loadReportForUser(Number(id), auth.user);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (report === "forbidden") return NextResponse.json({ error: "Not your report." }, { status: 403 });
  if (report.status !== "generated" || !report.assembled_data) {
    return NextResponse.json({ error: "Report has not been generated yet." }, { status: 409 });
  }

  const assembled = JSON.parse(report.assembled_data);
  const sectionViewModels = buildSectionViewModels(assembled);

  const buffer = await renderToBuffer(
    SoilReportDocument({ sectionViewModels, usageName: report.usage_name, reportId: report.id })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="soil-report-${report.id}.pdf"`,
    },
  });
}
