"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);

  async function load() {
    const res = await fetch("/api/reports");
    const data = await res.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function removeReport(id) {
    if (!confirm("Delete this report? This can't be undone.")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Customer reports</h1>
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
