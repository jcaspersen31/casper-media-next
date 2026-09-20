"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { buildSectionViewModels } from "@/lib/renderSections";
import ReportView from "../ReportView";

export default function ReportDetailPage({ params }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/reports/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load report.");
      return;
    }
    setReport(data.report);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${id}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${id}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeReport() {
    if (!confirm("Delete this report? This can't be undone.")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (error) {
    return (
      <div className="page">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page">
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{report.original_filename}</h1>
          <span className={`badge badge-${report.status}`}>{report.status}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {report.status === "generated" && (
            <a href={`/api/reports/${id}/pdf`} className="btn" style={{ textDecoration: "none" }}>
              Download PDF
            </a>
          )}
          {report.status === "generated" && (
            <button className="btn btn-outline" onClick={generate} disabled={busy}>
              {busy ? "Regenerating..." : "Regenerate report"}
            </button>
          )}
          <button className="btn btn-outline" onClick={removeReport}>
            Delete report
          </button>
        </div>
      </div>

      {report.auto_matched_columns?.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: "rgba(92,157,63,0.4)" }}>
          <strong style={{ color: "var(--green-light)" }}>Some columns were auto-matched by best guess</strong>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            {report.auto_matched_columns.map((c) => `${c.sourceLabel} → ${c.metricKey}`).join(", ")} — these weren&apos;t
            an exact match, so double-check the values below look right. If a guess is wrong, delete this report,
            have an admin fix it under Column mappings, and re-upload.
          </p>
        </div>
      )}

      {report.flagged_columns?.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: "rgba(216,165,72,0.4)" }}>
          <strong style={{ color: "var(--amber)" }}>Some columns weren&apos;t recognized</strong>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            {report.flagged_columns.join(", ")} — these weren&apos;t mapped to a known metric and were excluded from
            the report. An admin can map them under Column mappings.
          </p>
        </div>
      )}

      {report.status === "uploaded" && report.has_usable_data === false && (
        <div className="card" style={{ borderColor: "rgba(216,90,72,0.4)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--red)" }}>
            No usable data was found
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
            None of this file&apos;s columns could be matched to a known metric, so there would be nothing to put in
            a report. Delete this report and try re-uploading (a different export, or a cleaner copy of the file),
            or ask an admin to review the columns listed above under Column mappings.
          </p>
        </div>
      )}

      {report.status === "uploaded" && report.has_usable_data !== false && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Unlock this report</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
            Pay to run your samples through the rules engine and unlock the full deficiency report.
          </p>
          <button className="btn" onClick={pay} disabled={busy}>
            {busy ? "Processing..." : "Pay $49.00 (demo payment)"}
          </button>
          {error && <div className="error-text">{error}</div>}
        </div>
      )}

      {report.status === "paid" && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Payment received</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
            Generate your report to see deficiencies, recommendations, and product links.
          </p>
          <button className="btn" onClick={generate} disabled={busy}>
            {busy ? "Generating..." : "Generate report"}
          </button>
          {error && <div className="error-text">{error}</div>}
        </div>
      )}

      {report.status === "generated" && report.assembled_data && (() => {
        const sectionViewModels = buildSectionViewModels(report.assembled_data);
        if (!sectionViewModels) {
          return (
            <div className="card">
              <strong style={{ color: "var(--amber)" }}>This report needs to be regenerated</strong>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
                It was generated before a report-template update and is stored in an older format. Click{" "}
                <strong>Regenerate report</strong> above to rebuild it — your uploaded data is still saved, so nothing
                needs to be re-uploaded.
              </p>
            </div>
          );
        }
        return <ReportView sectionViewModels={sectionViewModels} usageName={report.usage_name} />;
      })()}
    </div>
  );
}
