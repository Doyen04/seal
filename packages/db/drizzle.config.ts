import { defineConfig } from "drizzle-kit";

// Load the API's local env file when present (Node 21.7+). Real environments
// (CI, Vercel) provide variables directly, so a missing file is fine.
try {
    process.loadEnvFile("../../apps/api/.env.local");
} catch {
    // no local env file
}

// Neon: prefer the direct (non-pooled) connection for migrations.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/schema.ts",
    out: "./drizzle",
    dbCredentials: { url: url ?? "" },
});
