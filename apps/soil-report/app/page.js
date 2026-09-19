import Link from "next/link";

export default function Home() {
  return (
    <div className="page">
      <div style={{ textAlign: "center", padding: "60px 0 40px" }}>
        <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16 }}>
          Know exactly what your soil needs.
        </h1>
        <p style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 560, margin: "0 auto 32px" }}>
          Upload your lab report — CSV, Excel, or PDF — and get a deficiency
          report with clear recommendations and product links, tailored to
          how you use the land.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/register" className="btn" style={{ textDecoration: "none" }}>
            Upload a report
          </Link>
          <Link href="/login" className="btn btn-outline" style={{ textDecoration: "none" }}>
            Log in
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 40 }}>
        <div className="card">
          <div style={{ fontSize: 24, marginBottom: 10 }}>📄</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>1. Upload</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Drop in your lab report from any supported lab, in CSV, Excel, or PDF.
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 24, marginBottom: 10 }}>💳</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>2. Pay</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            A single payment unlocks your full report.
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 24, marginBottom: 10 }}>📊</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>3. Get recommendations</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            View your report online or download a PDF, with product links for every deficiency.
          </div>
        </div>
      </div>
    </div>
  );
}
