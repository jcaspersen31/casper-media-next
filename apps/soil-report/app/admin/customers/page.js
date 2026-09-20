"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const emptyDraft = { email: "", name: "", company: "", password: "" };

export default function CustomersAdminPage() {
  const [rows, setRows] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    setRows(data.customers || []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(row) {
    setEditingId(row.id);
    setDraft({ email: row.email, name: row.name || "", company: row.company || "", password: "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const url = editingId ? `/api/admin/customers/${editingId}` : "/api/admin/customers";
    const method = editingId ? "PUT" : "POST";
    const body = editingId && !draft.password ? { ...draft, password: undefined } : draft;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    cancelEdit();
    load();
  }

  async function remove(row) {
    if (!confirm(`Delete ${row.email}? This also deletes their ${row.report_count} report(s). This can't be undone.`)) return;
    await fetch(`/api/admin/customers/${row.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Customers</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        Create and manage customer accounts. To upload a report on a customer&apos;s behalf (e.g. they mailed in
        samples and asked you to handle it), use the form on{" "}
        <Link href="/admin/reports" style={{ color: "var(--green-light)" }}>
          Customer reports
        </Link>{" "}
        — don&apos;t use your own admin account for their reports.
      </p>

      <form onSubmit={save} className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Email</label>
            <input type="email" required value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Name</label>
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Company</label>
            <input value={draft.company} onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">{editingId ? "New password (leave blank to keep current)" : "Password"}</label>
            <input
              type="password"
              required={!editingId}
              minLength={8}
              value={draft.password}
              onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
            />
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            {editingId ? "Save changes" : "Add customer"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {rows === null && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}
      {rows && rows.length === 0 && <p style={{ color: "var(--text-muted)" }}>No customers yet.</p>}
      {rows && rows.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Reports</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name || "—"}</td>
                  <td>{row.email}</td>
                  <td>{row.company || "—"}</td>
                  <td>{row.report_count}</td>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => startEdit(row)}>
                      Edit
                    </button>
                    <button className="btn btn-outline" style={{ padding: "4px 12px" }} onClick={() => remove(row)}>
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
