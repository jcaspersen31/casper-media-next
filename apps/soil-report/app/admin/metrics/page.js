"use client";

import AdminCrudTable from "../AdminCrudTable";

export default function MetricsAdminPage() {
  return (
    <AdminCrudTable
      title="Metrics"
      apiPath="/api/admin/metrics"
      listKey="metrics"
      emptyRow={{ key: "", display_name: "", unit: "" }}
      fields={[
        { key: "key", label: "Key", placeholder: "H3A_P" },
        { key: "display_name", label: "Display name", placeholder: "Phosphorus (H3A)" },
        { key: "unit", label: "Unit", placeholder: "ppm" },
      ]}
    />
  );
}
