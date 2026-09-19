// Applies schema.sql against DATABASE_URL. Safe to re-run (every statement
// is CREATE TABLE IF NOT EXISTS).
// Usage: npm run migrate
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL before running the migration (see .env.example).");
  process.exit(1);
}

const schema = fs.readFileSync(path.join(process.cwd(), "schema.sql"), "utf-8");

const pool = new pg.Pool({
  connectionString,
  ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
});

console.log("Applying schema.sql...");
await pool.query(schema);
console.log("Schema applied.");
await pool.end();
