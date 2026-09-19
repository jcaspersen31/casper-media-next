"use client";

import { useEffect, useState } from "react";

const emptyDraft = { lab_name: "", source_type: "csv", pairs: [{ label: "", metricKey: "" }] };

export default function LabProfilesAdminPage() {
  const [rows, setRows] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/lab-profiles");
    const data = await res.json();
    setRows(data.lab_profiles || []);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/metrics").then((r) => r.json()).then((d) => setMetrics(d.metrics || []));
  }, []);

  function startEdit(row) {
    const map = JSON.parse(row.column_map || "{}");
    const pairs = Object.entries(map).map(([label, metricKey]) => ({ label, metricKey }));
    setEditingId(row.id);
    setDraft({ lab_name: row.lab_name, source_type: row.source_type, pairs: pairs.length ? pairs : [{ label: "", metricKey: "" }] });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function updatePair(idx, field, value) {
    setDraft((d) => {
      const pairs = [...d.pairs];
      pairs[idx] = { ...pairs[idx], [field]: value };
      return { ...d, pairs };
    });
  }

  function addPair() {
    setDraft((d) => ({ ...d, pairs: [...d.pairs, { label: "", metricKey: "" }] }));
  }

  function removePair(idx) {
    setDraft((d) => ({ ...d, pairs: d.pairs.filter((_, i) => i !== idx) }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const column_map = {};
    for (const p of draft.pairs) {
      if (p.label && p.metricKey) column_map[p.label] = p.metricKey;
    }
    const body = { lab_name: draft.lab_name, source_type: draft.source_type, column_map };
    const url = editingId ? `/api/admin/lab-profiles/${editingId}` : "/api/admin/lab-profiles";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    cancelEdit();
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this lab profile?")) return;
    await fetch(`/api/admin/lab-profiles/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Lab profiles</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        Each profile maps a lab&apos;s column headers (or PDF line labels) to a canonical metric key. Use{" "}
        <code>sample_id</code> as the metric key to capture the sample/field identifier column.
      </p>

      <form onSubmit={save} className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Lab name</label>
            <input value={draft.lab_name} onChange={(e) => setDraft((d) => ({ ...d, lab_name: e.target.value }))} placeholder="Ward Labs Haney" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Source type</label>
            <select value={draft.source_type} onChange={(e) => setDraft((d) => ({ ...d, source_type: e.target.value }))}>
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        <label className="label">Column map</label>
        {draft.pairs.map((p, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Source column / label (e.g. 'pH')"
              value={p.label}
              onChange={(e) => updatePair(idx, "label", e.target.value)}
            />
            <select value={p.metricKey} onChange={(e) => updatePair(idx, "metricKey", e.target.value)}>
              <option value="">Metric...</option>
              <option value="sample_id">sample_id (field/sample identifier)</option>
              {metrics.map((m) => (
                <option key={m.id} value={m.key}>
                  {m.key}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-outline" onClick={() => removePair(idx)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-outline" onClick={addPair} style={{ marginBottom: 12 }}>
          + Add column mapping
        </button>

        {error && <div className="error-text">{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            {editingId ? "Save changes" : "Add lab profile"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {rows === null && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}
      {rows && rows.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Lab name</th>
                <th>Format</th>
                <th>Columns mapped</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.lab_name}</td>
                  <td>{row.source_type.toUpperCase()}</td>
                  <td>{Object.keys(JSON.parse(row.column_map || "{}")).length}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => startEdit(row)}>
                      Edit
                    </button>
                    <button className="btn btn-outline" style={{ padding: "4px 12px" }} onClick={() => remove(row.id)}>
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
