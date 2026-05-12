import "server-only";
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const DB_PATH =
  process.env.DATABASE_PATH ?? join(process.cwd(), "data", "agathas.db");

const SCHEMA_PATH = join(process.cwd(), "src", "lib", "db", "schema.sql");

declare global {
  // eslint-disable-next-line no-var
  var __agathasDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  const schemaSql = readFileSync(SCHEMA_PATH, "utf8");
  conn.exec(schemaSql);
  return conn;
}

export const db: Database.Database = globalThis.__agathasDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__agathasDb = db;
}
