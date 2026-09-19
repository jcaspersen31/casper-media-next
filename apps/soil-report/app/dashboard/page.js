"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABEL = {
  uploaded: "Uploaded — payment required",
  paid: "Paid — ready to generate",
  generated: "Report ready",
};

export default function DashboardPage() {
  const [reports, setReports] = useState(null);
  const [usages, setUsages] = useState([]);
  const [usageId, setUsageId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadReports() {
    const res = await fetch("/api/reports");
    const data = await res.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    loadReports();
    fetch("/api/usages").then((r) => r.json()).then((d) => setUsages(d.usages || []));
  }, []);

  async function onUpload(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("usage_id", usageId);
      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      let msg = `Uploaded — ${data.sampleCount} sample(s) parsed.`;
      if (data.autoMatchedColumns?.length) {
        msg += ` ${data.autoMatchedColumns.length} column(s) were auto-matched by best guess.`;
      }
      if (data.flaggedColumns?.length) {
        msg += ` ${data.flaggedColumns.length} column(s) weren't recognized: ${data.flaggedColumns.join(", ")}.`;
      }
      setNotice(msg);
      setFile(null);
      await loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeReport(id) {
    if (!confirm("Delete this report? This can't be undone.")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    loadReports();
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>My reports</h1>

      <div className="card" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Upload a lab report</h2>
        <form onSubmit={onUpload}>
          <div className="field">
            <label className="label">File (CSV, XLSX, or PDF)</label>
            <input type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="field">
            <label className="label">Land usage</label>
            <select required value={usageId} onChange={(e) => setUsageId(e.target.value)}>
              <option value="">Select...</option>
              {usages.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="error-text">{error}</div>}
          {notice && <div className="success-text">{notice}</div>}
          <button type="submit" className="btn" disabled={uploading} style={{ marginTop: 8 }}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>History</h2>
      {reports === null && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}
      {reports && reports.length === 0 && <p style={{ color: "var(--text-muted)" }}>No reports yet.</p>}
      {reports && reports.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.original_filename}</td>
                  <td>{r.usage_name || "—"}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/reports/${r.id}`} style={{ color: "var(--green-light)", marginRight: 16 }}>
                      View →
                    </Link>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 12px" }}
                      onClick={() => removeReport(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
