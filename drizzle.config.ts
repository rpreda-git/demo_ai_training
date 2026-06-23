import { defineConfig } from "drizzle-kit";

// Migrations are generated against the SQLite dialect and applied to D1 via
// `wrangler d1 migrations apply` (see package.json scripts).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/worker/db/schema.ts",
  out: "./drizzle/migrations",
});
