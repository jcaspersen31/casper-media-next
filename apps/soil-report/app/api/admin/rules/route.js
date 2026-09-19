import { makeCrudHandlers } from "@/lib/adminCrud";

const handlers = makeCrudHandlers({
  table: "rules",
  columns: ["usage_id", "metric_id", "band_low", "band_high", "band_label", "recommendation_text", "product_id"],
});

export const GET = handlers.list;
export const POST = handlers.create;
