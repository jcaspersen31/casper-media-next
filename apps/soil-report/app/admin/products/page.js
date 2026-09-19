"use client";

import AdminCrudTable from "../AdminCrudTable";

export default function ProductsAdminPage() {
  return (
    <AdminCrudTable
      title="Products"
      apiPath="/api/admin/products"
      listKey="products"
      emptyRow={{ name: "", store_url: "", category: "" }}
      fields={[
        { key: "name", label: "Name", placeholder: "Ag Lime Pallet" },
        { key: "store_url", label: "Store URL", placeholder: "https://store.example.com/..." },
        { key: "category", label: "Category", placeholder: "lime" },
      ]}
    />
  );
}
