import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/column-aliases", label: "Column mappings" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/usages", label: "Usages" },
  { href: "/admin/rules", label: "Rules" },
  { href: "/admin/report-templates", label: "Report templates" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reports", label: "Customer reports" },
];

export default function AdminLayout({ children }) {
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", gap: 32 }}>
        <aside style={{ width: 180, flexShrink: 0 }}>
          <nav style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: 14,
                  padding: "8px 10px",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "var(--text-muted)",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
