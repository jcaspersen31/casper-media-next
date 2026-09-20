import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/apiAuth";
import { loadReportForUser, hasUsableData } from "@/lib/reports";
import { db } from "@/lib/db";

// POC payment amount. In production this would come from admin-configurable
// pricing and the "paid" transition would happen from a verified Stripe
// webhook rather than directly from the client.
const REPORT_PRICE_CENTS = 4900;

export async function POST(request, { params }) {
  const auth = await requireUserOrResponse();
  if (auth.response) return auth.response;

  const { id } = await params;
  const report = await loadReportForUser(Number(id), auth.user);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (report === "forbidden") return NextResponse.json({ error: "Not your report." }, { status: 403 });

  if (report.status !== "uploaded") {
    return NextResponse.json({ error: `Report is already ${report.status}.` }, { status: 409 });
  }

  const samples = await db.prepare("SELECT raw_values FROM samples WHERE report_id = ?").all(report.id);
  if (!hasUsableData(samples)) {
    return NextResponse.json(
      {
        error:
          "None of this report's columns could be matched to a known metric, so there's nothing to evaluate. Delete it and re-upload, or ask an admin to review the flagged columns first.",
      },
      { status: 422 }
    );
  }

  const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

  // Real Stripe integration point: when STRIPE_SECRET_KEY is set, this is
  // where a Checkout Session/PaymentIntent would be created and confirmed
  // (or, better, this route would only be reachable after a webhook marks
  // the PaymentIntent succeeded). For the POC we simulate an instant
  // successful payment so the rest of the flow can be demoed without keys.
  await db
    .prepare("INSERT INTO payments (report_id, amount, status, provider_ref) VALUES (?,?,?,?)")
    .run(report.id, REPORT_PRICE_CENTS, "paid", isStripeConfigured ? null : "MOCK_PAYMENT");

  await db.prepare("UPDATE reports SET status = 'paid' WHERE id = ?").run(report.id);

  return NextResponse.json({ ok: true, amount: REPORT_PRICE_CENTS, mock: !isStripeConfigured });
}
