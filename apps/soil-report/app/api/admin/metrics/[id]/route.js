import { makeCrudHandlers } from "@/lib/adminCrud";

const handlers = makeCrudHandlers({ table: "metrics", columns: ["key", "display_name", "unit"] });

export const PUT = handlers.update;
export const DELETE = handlers.remove;
