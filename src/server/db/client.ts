import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

function resolveSqlitePath(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/kdt.sqlite";
  const p = url.replace(/^file:/, "");
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  return abs;
}

/**
 * Erstellt eine Datenbankverbindung. Heute SQLite; für Postgres später hier
 * einen zweiten Zweig anhand von DB_DIALECT ergänzen – Repositories bleiben gleich.
 */
export function createDb(): Db {
  const sqlite = new Database(resolveSqlitePath());
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as { __kdtDb?: Db };

/** Prozessweit geteilte Verbindung (Next.js lädt Module im Dev-Modus mehrfach). */
export function getDb(): Db {
  if (!globalForDb.__kdtDb) globalForDb.__kdtDb = createDb();
  return globalForDb.__kdtDb;
}
