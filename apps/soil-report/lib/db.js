import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. This app runs against Postgres — set DATABASE_URL (see .env.example), then run `npm run migrate` and `npm run seed`."
  );
}

// Reuse a single pool across hot reloads in dev.
const globalForDb = globalThis;

function createPool() {
  return new pg.Pool({
    connectionString,
    // Railway (and most hosted Postgres) require SSL for external
    // connections but don't hand out a verifiable CA, hence rejectUnauthorized:
    // false rather than skipping SSL entirely. Local/dev connections don't need it.
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
  });
}

const pool = globalForDb.__soilPgPool || createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__soilPgPool = pool;

function toPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Thin async wrapper matching better-sqlite3's prepare().get/all/run shape,
// so call sites read the same as before with `await` added. INSERT
// statements automatically get `RETURNING id` appended (every table here
// has an `id` primary key) so `.run(...).lastInsertRowid` keeps working;
// statements that need SQLite-only syntax (e.g. INSERT OR IGNORE) are
// written directly in Postgres syntax at their call site instead.
class Statement {
  constructor(sql) {
    const trimmed = sql.trim();
    const isInsert = /^insert/i.test(trimmed);
    const hasReturning = /returning/i.test(trimmed);
    this.text = toPgParams(trimmed) + (isInsert && !hasReturning ? " RETURNING id" : "");
  }

  _clean(params) {
    return params.map((p) => (p === undefined ? null : p));
  }

  async get(...params) {
    const res = await pool.query(this.text, this._clean(params));
    return res.rows[0];
  }

  async all(...params) {
    const res = await pool.query(this.text, this._clean(params));
    return res.rows;
  }

  async run(...params) {
    const res = await pool.query(this.text, this._clean(params));
    return { changes: res.rowCount, lastInsertRowid: res.rows[0]?.id };
  }
}

export const db = {
  prepare(sql) {
    return new Statement(sql);
  },
};
