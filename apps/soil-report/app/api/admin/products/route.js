import { makeCrudHandlers } from "@/lib/adminCrud";

const handlers = makeCrudHandlers({ table: "products", columns: ["name", "store_url", "category"], orderBy: "name" });

export const GET = handlers.list;
export const POST = handlers.create;
