"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [usages, setUsages] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [usageId, setUsageId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const res = await fetch("/api/reports");
    const data = await res.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/customers").then((r) => r.json()).then((d) => setCustomers(d.customers || []));
    fetch("/api/usages").then((r) => r.json()).then((d) => setUsages(d.usages || []));
  }, []);

  async function removeReport(id) {
    if (!confirm("Delete this report? This can't be undone.")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    load();
  }

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
      fd.append("customer_id", customerId);
      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      let msg = `Uploaded — ${data.sampleCount} sample(s) parsed.`;
      if (data.autoMatchedColumns?.length) {
        msg += ` ${data.autoMatchedColumns.length} column(s) auto-matched by best guess.`;
      }
      if (data.flaggedColumns?.length) {
        msg += ` ${data.flaggedColumns.length} column(s) weren't recognized.`;
      }
      setNotice(msg);
      setFile(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Customer reports</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Upload for a customer</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
          For samples a customer mailed in or asked you to handle directly. This report belongs to the customer you
          pick here, not to your admin account.
        </p>
        {customers.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No customer accounts yet — add one under{" "}
            <Link href="/admin/customers" style={{ color: "var(--green-light)" }}>
              Customers
            </Link>{" "}
            first.
          </p>
        ) : (
          <form onSubmit={onUpload}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label className="label">Customer</label>
                <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email} ({c.email})
                    </option>
                  ))}
                </select>
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
            </div>
            <div className="field">
              <label className="label">File (CSV, XLSX, or PDF)</label>
              <input type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            {error && <div className="error-text">{error}</div>}
            {notice && <div className="success-text">{notice}</div>}
            <button type="submit" className="btn" disabled={uploading} style={{ marginTop: 8 }}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        )}
      </div>

      {reports === null && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}
      {reports && reports.length === 0 && <p style={{ color: "var(--text-muted)" }}>No reports uploaded yet.</p>}
      {reports && reports.length > 0 && (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
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
                  <td>
                    {r.customer_name}
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{r.customer_email}</div>
                  </td>
                  <td>{r.original_filename}</td>
                  <td>{r.usage_name || "—"}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/reports/${r.id}`} style={{ color: "var(--green-light)", marginRight: 16 }}>
                      View →
                    </Link>
                    <button className="btn btn-outline" style={{ padding: "4px 12px" }} onClick={() => removeReport(r.id)}>
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
