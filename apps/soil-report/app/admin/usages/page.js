"use client";

import AdminCrudTable from "../AdminCrudTable";

export default function UsagesAdminPage() {
  return (
    <AdminCrudTable
      title="Usages"
      apiPath="/api/admin/usages"
      listKey="usages"
      emptyRow={{ name: "", description: "" }}
      fields={[
        { key: "name", label: "Name", placeholder: "Row Crop Farming" },
        { key: "description", label: "Description", placeholder: "Commodity row crops" },
      ]}
    />
  );
}
