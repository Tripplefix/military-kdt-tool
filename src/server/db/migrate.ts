import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { createDb } from "./client";

const db = createDb();
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
console.log("Migrationen angewendet.");
