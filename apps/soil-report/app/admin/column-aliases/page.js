"use client";

import { useEffect, useState } from "react";

const emptyDraft = { header_text: "", metric_key: "" };

export default function ColumnAliasesAdminPage() {
  const [rows, setRows] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/column-aliases");
    const data = await res.json();
    setRows(data.column_aliases || []);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/metrics").then((r) => r.json()).then((d) => setMetrics(d.metrics || []));
  }, []);

  function startEdit(row) {
    setEditingId(row.id);
    setDraft({ header_text: row.header_text, metric_key: row.metric_key });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const url = editingId ? `/api/admin/column-aliases/${editingId}` : "/api/admin/column-aliases";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    cancelEdit();
    load();
  }

  async function confirmRow(row) {
    await fetch(`/api/admin/column-aliases/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ header_text: row.header_text, metric_key: row.metric_key }),
    });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this mapping? Uploads with this header will go back to being flagged.")) return;
    await fetch(`/api/admin/column-aliases/${id}`, { method: "DELETE" });
    load();
  }

  const unconfirmed = rows ? rows.filter((r) => !r.confirmed) : [];
  const confirmed = rows ? rows.filter((r) => r.confirmed) : [];

  function Row({ row }) {
    return (
      <tr key={row.id}>
        <td>
          <code>{row.header_text}</code>
        </td>
        <td>{row.metric_key}</td>
        <td>
          {row.confirmed ? (
            <span className="badge badge-generated">Confirmed</span>
          ) : (
            <span className="badge badge-uploaded">Auto-learned</span>
          )}
        </td>
        <td style={{ whiteSpace: "nowrap" }}>
          {!row.confirmed && (
            <button className="btn btn-outline" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => confirmRow(row)}>
              Confirm
            </button>
          )}
          <button className="btn btn-outline" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => startEdit(row)}>
            Edit
          </button>
          <button className="btn btn-outline" style={{ padding: "4px 12px" }} onClick={() => remove(row.id)}>
            Delete
          </button>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Column mappings</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        Customers never pick a lab format — every uploaded column is matched against this table (exact match first,
        then a fuzzy guess). A confident guess is saved here automatically as <strong>auto-learned</strong> so the
        same header resolves instantly next time; review and confirm it here, or correct it if it guessed wrong.
        Unmapped columns show up flagged on the report instead of guessed.
      </p>

      <form onSubmit={save} className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Source column header</label>
            <input
              value={draft.header_text}
              onChange={(e) => setDraft((d) => ({ ...d, header_text: e.target.value }))}
              placeholder="e.g. H3A ICAP Potassium"
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Maps to</label>
            <select required value={draft.metric_key} onChange={(e) => setDraft((d) => ({ ...d, metric_key: e.target.value }))}>
              <option value="">Select...</option>
              <option value="sample_id">sample_id (field/sample identifier)</option>
              {metrics.map((m) => (
                <option key={m.id} value={m.key}>
                  {m.key}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            {editingId ? "Save changes" : "Add mapping"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {rows === null && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}

      {unconfirmed.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Auto-learned — needs review ({unconfirmed.length})</h2>
          <div className="card" style={{ padding: 0, marginBottom: 24 }}>
            <table>
              <thead>
                <tr>
                  <th>Header</th>
                  <th>Maps to</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unconfirmed.map((row) => (
                  <Row row={row} key={row.id} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {confirmed.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Confirmed mappings ({confirmed.length})</h2>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Header</th>
                  <th>Maps to</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {confirmed.map((row) => (
                  <Row row={row} key={row.id} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
