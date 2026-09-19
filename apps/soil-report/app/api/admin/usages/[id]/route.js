import { makeCrudHandlers } from "@/lib/adminCrud";

const handlers = makeCrudHandlers({ table: "usages", columns: ["name", "description"] });

export const PUT = handlers.update;
export const DELETE = handlers.remove;
