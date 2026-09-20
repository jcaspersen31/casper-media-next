"use client";

import { useEffect, useMemo, useState } from "react";

const SECTION_TYPES = [
  { value: "metric_table", label: "Metric table", description: "A table of metric / value / rating / recommendation rows." },
  { value: "narrative", label: "Narrative paragraph", description: "One sentence per metric, joined into a written paragraph." },
  { value: "product_list", label: "Product list", description: "Products from a chosen category, shown as cards/links." },
];

const DEFAULT_SENTENCE_TEMPLATE = "{metric} measured {value}{unit}, rated {band}. {recommendation}";
const PLACEHOLDERS = ["{metric}", "{value}", "{unit}", "{band}", "{recommendation}"];

const emptyDraft = {
  title: "",
  type: "metric_table",
  intro_text: "",
  metricFilter: "all", // "all" | "selected"
  metric_keys: [],
  sentence_template: DEFAULT_SENTENCE_TEMPLATE,
  product_category: "",
};

export default function ReportSectionsAdminPage() {
  const [rows, setRows] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/report-sections");
    const data = await res.json();
    setRows(data.report_sections || []);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/metrics").then((r) => r.json()).then((d) => setMetrics(d.metrics || []));
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setCategories([...new Set((d.products || []).map((p) => p.category).filter(Boolean))]));
  }, []);

  function startEdit(row) {
    setEditingId(row.id);
    const metricKeys = row.metric_keys ? JSON.parse(row.metric_keys) : [];
    setDraft({
      title: row.title,
      type: row.type,
      intro_text: row.intro_text || "",
      metricFilter: metricKeys.length > 0 ? "selected" : "all",
      metric_keys: metricKeys,
      sentence_template: row.sentence_template || DEFAULT_SENTENCE_TEMPLATE,
      product_category: row.product_category || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function toggleMetric(key) {
    setDraft((d) => ({
      ...d,
      metric_keys: d.metric_keys.includes(key) ? d.metric_keys.filter((k) => k !== key) : [...d.metric_keys, key],
    }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const body = {
      title: draft.title,
      type: draft.type,
      intro_text: draft.intro_text || null,
      metric_keys: draft.metricFilter === "selected" ? draft.metric_keys : [],
      sentence_template: draft.type === "narrative" ? draft.sentence_template || DEFAULT_SENTENCE_TEMPLATE : null,
      product_category: draft.type === "product_list" ? draft.product_category : null,
    };
    const url = editingId ? `/api/admin/report-sections/${editingId}` : "/api/admin/report-sections";
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

  async function remove(row) {
    if (
      !confirm(
        `Delete "${row.title}"? Any report template that includes it will just skip it — no reports are affected retroactively.`
      )
    )
      return;
    await fetch(`/api/admin/report-sections/${row.id}`, { method: "DELETE" });
    load();
  }

  const metricLookup = useMemo(() => Object.fromEntries(metrics.map((m) => [m.key, m.display_name])), [metrics]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Report sections</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        Build the blocks a report can be made of. Each section is a table, a written paragraph, or a product list —
        assemble them into a usage&apos;s report under{" "}
        <a href="/admin/report-templates" style={{ color: "var(--green-light)" }}>
          Report templates
        </a>
        .
      </p>

      <form onSubmit={save} className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Title</label>
            <input required value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Type</label>
            <select
              value={draft.type}
              disabled={!!editingId}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
            >
              {SECTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
          {SECTION_TYPES.find((t) => t.value === draft.type)?.description}
        </p>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="label">Intro text (optional)</label>
          <textarea
            rows={2}
            value={draft.intro_text}
            onChange={(e) => setDraft((d) => ({ ...d, intro_text: e.target.value }))}
            placeholder="A sentence or two of lead-in copy shown above this section's content."
          />
        </div>

        {(draft.type === "metric_table" || draft.type === "narrative") && (
          <div className="field">
            <label className="label">Metrics included</label>
            <div style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="metricFilter"
                  checked={draft.metricFilter === "all"}
                  onChange={() => setDraft((d) => ({ ...d, metricFilter: "all" }))}
                />
                All evaluated metrics
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="metricFilter"
                  checked={draft.metricFilter === "selected"}
                  onChange={() => setDraft((d) => ({ ...d, metricFilter: "selected" }))}
                />
                Only selected metrics
              </label>
            </div>
            {draft.metricFilter === "selected" && (
              <div
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 10,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                }}
              >
                {metrics.map((m) => (
                  <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={draft.metric_keys.includes(m.key)}
                      onChange={() => toggleMetric(m.key)}
                    />
                    {m.display_name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {draft.type === "narrative" && (
          <div className="field">
            <label className="label">Per-metric sentence template</label>
            <input
              value={draft.sentence_template}
              onChange={(e) => setDraft((d) => ({ ...d, sentence_template: e.target.value }))}
              placeholder={DEFAULT_SENTENCE_TEMPLATE}
            />
            <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
              One sentence is generated per metric using this template, then joined into a paragraph. Placeholders:{" "}
              {PLACEHOLDERS.join(" ")}
            </p>
          </div>
        )}

        {draft.type === "product_list" && (
          <div className="field">
            <label className="label">Product category</label>
            <input
              required
              list="product-categories"
              value={draft.product_category}
              onChange={(e) => setDraft((d) => ({ ...d, product_category: e.target.value }))}
              placeholder="e.g. cool_season_seed"
            />
            <datalist id="product-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
              Matches the category field on Products. Existing categories: {categories.join(", ") || "none yet"}
            </p>
          </div>
        )}

        {error && <div className="error-text">{error}</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            {editingId ? "Save changes" : "Add section"}
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
                <th>Title</th>
                <th>Type</th>
                <th>Metrics / category</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const metricKeys = row.metric_keys ? JSON.parse(row.metric_keys) : [];
                return (
                  <tr key={row.id}>
                    <td>
                      {row.title}
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        <code>{row.key}</code>
                      </div>
                    </td>
                    <td>{SECTION_TYPES.find((t) => t.value === row.type)?.label || row.type}</td>
                    <td style={{ fontSize: 13 }}>
                      {row.type === "product_list"
                        ? row.product_category
                        : metricKeys.length
                        ? metricKeys.map((k) => metricLookup[k] || k).join(", ")
                        : "All metrics"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn btn-outline" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => startEdit(row)}>
                        Edit
                      </button>
                      <button className="btn btn-outline" style={{ padding: "4px 12px" }} onClick={() => remove(row)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
