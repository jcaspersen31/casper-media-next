"use client";

import { useEffect, useState } from "react";

const emptyDraft = {
  usage_id: "",
  metric_id: "",
  band_low: "",
  band_high: "",
  band_label: "Medium",
  recommendation_text: "",
  product_id: "",
};

export default function RulesAdminPage() {
  const [rows, setRows] = useState(null);
  const [usages, setUsages] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/rules");
    const data = await res.json();
    setRows(data.rules || []);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/usages").then((r) => r.json()).then((d) => setUsages(d.usages || []));
    fetch("/api/admin/metrics").then((r) => r.json()).then((d) => setMetrics(d.metrics || []));
    fetch("/api/admin/products").then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  function nameFor(list, id) {
    const row = list.find((r) => r.id === id);
    return row ? row.name || row.display_name || row.key : "—";
  }

  function startEdit(row) {
    setEditingId(row.id);
    setDraft({
      usage_id: row.usage_id,
      metric_id: row.metric_id,
      band_low: row.band_low ?? "",
      band_high: row.band_high ?? "",
      band_label: row.band_label,
      recommendation_text: row.recommendation_text || "",
      product_id: row.product_id ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const body = {
      usage_id: Number(draft.usage_id),
      metric_id: Number(draft.metric_id),
      band_low: draft.band_low === "" ? null : Number(draft.band_low),
      band_high: draft.band_high === "" ? null : Number(draft.band_high),
      band_label: draft.band_label,
      recommendation_text: draft.recommendation_text,
      product_id: draft.product_id === "" ? null : Number(draft.product_id),
    };
    const url = editingId ? `/api/admin/rules/${editingId}` : "/api/admin/rules";
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
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/admin/rules/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Rules</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        A value matches a rule when <code>band_low ≤ value &lt; band_high</code>. Leave low/high blank for an open-ended band.
      </p>

      <form onSubmit={save} className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Usage</label>
            <select required value={draft.usage_id} onChange={(e) => setDraft((d) => ({ ...d, usage_id: e.target.value }))}>
              <option value="">Select...</option>
              {usages.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Metric</label>
            <select required value={draft.metric_id} onChange={(e) => setDraft((d) => ({ ...d, metric_id: e.target.value }))}>
              <option value="">Select...</option>
              {metrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.key}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Band low (blank = -∞)</label>
            <input type="number" step="any" value={draft.band_low} onChange={(e) => setDraft((d) => ({ ...d, band_low: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Band high (blank = +∞)</label>
            <input type="number" step="any" value={draft.band_high} onChange={(e) => setDraft((d) => ({ ...d, band_high: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Band label</label>
            <select value={draft.band_label} onChange={(e) => setDraft((d) => ({ ...d, band_label: e.target.value }))}>
              <option>Very Low</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Very High</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label">Recommendation text</label>
          <textarea
            rows={2}
            value={draft.recommendation_text}
            onChange={(e) => setDraft((d) => ({ ...d, recommendation_text: e.target.value }))}
          />
        </div>

        <div className="field">
          <label className="label">Linked product (optional)</label>
          <select value={draft.product_id} onChange={(e) => setDraft((d) => ({ ...d, product_id: e.target.value }))}>
            <option value="">None</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-text">{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            {editingId ? "Save changes" : "Add rule"}
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
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Usage</th>
                <th>Metric</th>
                <th>Range</th>
                <th>Band</th>
                <th>Product</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{nameFor(usages, row.usage_id)}</td>
                  <td>{nameFor(metrics, row.metric_id)}</td>
                  <td>
                    {row.band_low ?? "−∞"} – {row.band_high ?? "+∞"}
                  </td>
                  <td>{row.band_label}</td>
                  <td>{row.product_id ? nameFor(products, row.product_id) : "—"}</td>
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
