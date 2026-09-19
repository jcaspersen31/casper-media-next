import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "./apiAuth";
import { db } from "./db";

// Builds a simple whitelist-column CRUD handler set for one table. Column
// names are always developer-supplied (never taken from the request), so
// building SQL from them is safe; only values are parameterized.
export function makeCrudHandlers({ table, columns, orderBy = "id" }) {
  function serializeBody(body) {
    const values = columns.map((c) => (body[c] === undefined ? null : body[c]));
    return values;
  }

  async function list() {
    const auth = await requireAdminOrResponse();
    if (auth.response) return auth.response;
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
    return NextResponse.json({ [table]: rows });
  }

  async function create(request) {
    const auth = await requireAdminOrResponse();
    if (auth.response) return auth.response;
    const body = await request.json();
    const placeholders = columns.map(() => "?").join(",");
    const info = db
      .prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`)
      .run(...serializeBody(body));
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    return NextResponse.json({ [table.replace(/s$/, "")]: row }, { status: 201 });
  }

  async function update(request, { params }) {
    const auth = await requireAdminOrResponse();
    if (auth.response) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const setClause = columns.map((c) => `${c} = ?`).join(", ");
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...serializeBody(body), Number(id));
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(Number(id));
    return NextResponse.json({ [table.replace(/s$/, "")]: row });
  }

  async function remove(request, { params }) {
    const auth = await requireAdminOrResponse();
    if (auth.response) return auth.response;
    const { id } = await params;
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(Number(id));
    return NextResponse.json({ ok: true });
  }

  return { list, create, update, remove };
}
