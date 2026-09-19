import { makeCrudHandlers } from "@/lib/adminCrud";

const handlers = makeCrudHandlers({ table: "metrics", columns: ["key", "display_name", "unit"], orderBy: "display_name" });

export const GET = handlers.list;
export const POST = handlers.create;
