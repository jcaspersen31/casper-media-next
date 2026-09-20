function bandClass(band) {
  return `band-${band.replace(/\s+/g, "_")}`;
}

function MetricTable({ evaluations }) {
  if (evaluations.length === 0) {
    return <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No matching metrics on this sample.</p>;
  }
  return (
    <div style={{ overflowX: "auto", marginBottom: 12 }}>
    <table style={{ marginBottom: 0 }}>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
          <th>Rating</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        {evaluations.map((e) => (
          <tr key={e.metricKey}>
            <td>{e.displayName}</td>
            <td>
              {e.value}
              {e.unit ? ` ${e.unit}` : ""}
            </td>
            <td className={bandClass(e.band)}>{e.band}</td>
            <td>
              {e.recommendation}
              {e.product && (
                <>
                  {" "}
                  <a href={e.product.storeUrl} target="_blank" rel="noreferrer" style={{ color: "var(--green-light)" }}>
                    Shop {e.product.name} →
                  </a>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export default function ReportView({ sectionViewModels, usageName }) {
  return (
    <div>
      <p style={{ color: "var(--text-dim)", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 24 }}>
        {usageName}
      </p>
      {sectionViewModels.map((section) => (
        <div key={section.key} className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: section.introText ? 8 : 16 }}>{section.title}</h2>
          {section.introText && (
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>
              {section.introText}
            </p>
          )}

          {section.type === "product_list" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12 }}>
              {section.products.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No products in this category yet.</p>
              )}
              {section.products.map((p) => (
                <a
                  key={p.id}
                  href={p.store_url}
                  target="_blank"
                  rel="noreferrer"
                  className="card"
                  style={{ textDecoration: "none", color: "var(--text)" }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "var(--green-light)" }}>Shop now →</div>
                </a>
              ))}
            </div>
          )}

          {(section.type === "metric_table" || section.type === "narrative") &&
            section.perSample.map((s) => (
              <div key={s.sampleId} style={{ marginBottom: 12 }}>
                {section.perSample.length > 1 && (
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{s.sampleId}</div>
                )}
                {section.type === "narrative" ? (
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: 14 }}>{s.narrative}</p>
                ) : (
                  <MetricTable evaluations={s.evaluations} />
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
