import { defineConfig } from "drizzle-kit";

const url = (process.env.DATABASE_URL ?? "file:./data/kdt.sqlite").replace(/^file:/, "");

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
