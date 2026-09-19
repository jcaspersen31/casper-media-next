import { makeCrudHandlers } from "@/lib/adminCrud";

const handlers = makeCrudHandlers({ table: "usages", columns: ["name", "description"], orderBy: "name" });

export const GET = handlers.list;
export const POST = handlers.create;
