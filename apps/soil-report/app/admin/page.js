import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminHome() {
  const [reports, paid, customers, columnAliases, unconfirmedAliases, rules, products] = await Promise.all([
    db.prepare("SELECT COUNT(*)::int c FROM reports").get(),
    db.prepare("SELECT COUNT(*)::int c FROM reports WHERE status != 'uploaded'").get(),
    db.prepare("SELECT COUNT(*)::int c FROM users WHERE role = 'customer'").get(),
    db.prepare("SELECT COUNT(*)::int c FROM column_aliases").get(),
    db.prepare("SELECT COUNT(*)::int c FROM column_aliases WHERE confirmed = 0").get(),
    db.prepare("SELECT COUNT(*)::int c FROM rules").get(),
    db.prepare("SELECT COUNT(*)::int c FROM products").get(),
  ]);

  const counts = {
    reports: reports.c,
    paid: paid.c,
    customers: customers.c,
    columnAliases: columnAliases.c,
    unconfirmedAliases: unconfirmedAliases.c,
    rules: rules.c,
    products: products.c,
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
