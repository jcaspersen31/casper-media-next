"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((d) => setReports(d.reports || []));
  }, []);

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
                  <td>
                    <Link href={`/reports/${r.id}`} style={{ color: "var(--green-light)" }}>
                      View →
                    </Link>
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
