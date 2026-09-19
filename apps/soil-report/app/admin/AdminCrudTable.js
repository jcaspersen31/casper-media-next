"use client";

import { useEffect, useState } from "react";

// Generic list+inline-create+edit+delete table for simple, flat-column
// admin resources (metrics, usages, products). Rules/lab-profiles/templates
// have relational or JSON fields and get their own pages.
export default function AdminCrudTable({ title, apiPath, listKey, fields, emptyRow }) {
  const [rows, setRows] = useState(null);
  const [draft, setDraft] = useState(emptyRow);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(apiPath);
    const data = await res.json();
    setRows(data[listKey] || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(row) {
    setEditingId(row.id);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ""])));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyRow);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const url = editingId ? `${apiPath}/${editingId}` : apiPath;
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    cancelEdit();
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this row?")) return;
    await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{title}</h1>

      <form onSubmit={save} className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${fields.length}, 1fr)`, gap: 12 }}>
          {fields.map((f) => (
            <div key={f.key} className="field" style={{ marginBottom: 0 }}>
              <label className="label">{f.label}</label>
              <input
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                placeholder={f.placeholder || ""}
              />
            </div>
          ))}
        </div>
        {error && <div className="error-text">{error}</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            {editingId ? "Save changes" : "Add"}
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
                {fields.map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {fields.map((f) => (
                    <td key={f.key}>{row[f.key]}</td>
                  ))}
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
