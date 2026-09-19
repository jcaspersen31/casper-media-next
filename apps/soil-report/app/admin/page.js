import Link from "next/link";
import { db } from "@/lib/db";

export default function AdminHome() {
  const counts = {
    reports: db.prepare("SELECT COUNT(*) c FROM reports").get().c,
    paid: db.prepare("SELECT COUNT(*) c FROM reports WHERE status != 'uploaded'").get().c,
    customers: db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'customer'").get().c,
    columnAliases: db.prepare("SELECT COUNT(*) c FROM column_aliases").get().c,
    unconfirmedAliases: db.prepare("SELECT COUNT(*) c FROM column_aliases WHERE confirmed = 0").get().c,
    rules: db.prepare("SELECT COUNT(*) c FROM rules").get().c,
    products: db.prepare("SELECT COUNT(*) c FROM products").get().c,
  };

  const cards = [
    ["Reports uploaded", counts.reports],
    ["Reports paid or generated", counts.paid],
    ["Customers", counts.customers],
    ["Column mappings", counts.columnAliases],
    ["Auto-learned, needs review", counts.unconfirmedAliases],
    ["Rules configured", counts.rules],
    ["Products", counts.products],
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Admin</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16 }}>
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 24, color: "var(--text-muted)", fontSize: 14 }}>
        Manage usages, rules, report templates, and products from the sidebar. Check{" "}
        <Link href="/admin/column-aliases" style={{ color: "var(--green-light)" }}>
          column mappings
        </Link>{" "}
        for any auto-learned guesses that need review, and see{" "}
        <Link href="/admin/reports" style={{ color: "var(--green-light)" }}>
          customer reports
        </Link>{" "}
        to view or delete any uploaded report.
      </p>
    </div>
  );
}
