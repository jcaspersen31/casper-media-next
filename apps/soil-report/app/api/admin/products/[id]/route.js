import { makeCrudHandlers } from "@/lib/adminCrud";

const handlers = makeCrudHandlers({ table: "products", columns: ["name", "store_url", "category"] });

export const PUT = handlers.update;
export const DELETE = handlers.remove;
