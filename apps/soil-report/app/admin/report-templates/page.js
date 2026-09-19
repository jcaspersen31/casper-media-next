"use client";

import { useEffect, useState } from "react";

const SECTION_KEYS = [
  { key: "biology_narrative", label: "Soil biology narrative" },
  { key: "crop_fertilizer_table", label: "Crop fertilizer table" },
  { key: "lime_recommendation", label: "Lime recommendation" },
  { key: "cool_season_mix", label: "Cool season mix recommendations" },
  { key: "warm_season_mix", label: "Warm season mix recommendations" },
  { key: "seasonal_nutrient_table", label: "Seasonal nutrient table" },
];

export default function ReportTemplatesAdminPage() {
  const [rows, setRows] = useState(null);
  const [usages, setUsages] = useState([]);
  const [newUsageId, setNewUsageId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/report-templates");
    const data = await res.json();
    setRows(data.report_templates || []);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/usages").then((r) => r.json()).then((d) => setUsages(d.usages || []));
  }, []);

  async function toggleSection(row, key) {
    const current = JSON.parse(row.sections || "[]");
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    await fetch(`/api/admin/report-templates/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: next }),
    });
    load();
  }

  async function moveSection(row, key, dir) {
    const current = JSON.parse(row.sections || "[]");
    const idx = current.indexOf(key);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= current.length) return;
    const next = [...current];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    await fetch(`/api/admin/report-templates/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: next }),
    });
    load();
  }

  async function createTemplate(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/report-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usage_id: Number(newUsageId), sections: [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create template");
      return;
    }
    setNewUsageId("");
    load();
  }

  const usagesWithoutTemplate = rows ? usages.filter((u) => !rows.some((r) => r.usage_id === u.id)) : [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Report templates</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        Each usage has one template that controls which sections appear in its reports, and in what order.
      </p>

      {rows === null && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}

      {rows &&
        rows.map((row) => {
          const sections = JSON.parse(row.sections || "[]");
          return (
            <div key={row.id} className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{row.usage_name}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SECTION_KEYS.map((sec) => {
                  const included = sections.includes(sec.key);
                  const order = sections.indexOf(sec.key);
                  return (
                    <div key={sec.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={included} onChange={() => toggleSection(row, sec.key)} />
                      <span style={{ flex: 1, fontSize: 14 }}>{sec.label}</span>
                      {included && (
                        <>
                          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>#{order + 1}</span>
                          <button className="btn btn-outline" style={{ padding: "2px 8px" }} onClick={() => moveSection(row, sec.key, -1)}>
                            ↑
                          </button>
                          <button className="btn btn-outline" style={{ padding: "2px 8px" }} onClick={() => moveSection(row, sec.key, 1)}>
                            ↓
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {usagesWithoutTemplate.length > 0 && (
        <form onSubmit={createTemplate} className="card">
          <label className="label">Create a template for</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select required value={newUsageId} onChange={(e) => setNewUsageId(e.target.value)}>
              <option value="">Select a usage...</option>
              {usagesWithoutTemplate.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn">
              Create
            </button>
          </div>
          {error && <div className="error-text">{error}</div>}
        </form>
      )}
    </div>
  );
}
