import { config as loadEnvFile } from "dotenv";
import { defineConfig } from "drizzle-kit";

function fileURL(url: URL): string {
    return url.pathname;
}

// Resolve the env file from this file's own location rather than process.cwd(),
// so the path holds no matter which directory the command is invoked from.
const envFile = new URL("../../apps/api/.env.local", import.meta.url);

// dotenv never overrides variables that are already set, so CI and production
// keep using the values their platform provides and this file stays a local
// development fallback.
const { error: envFileError } = loadEnvFile({ path: envFile, quiet: true });

// Neon: prefer the direct (non-pooled) connection for migrations.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
    const reason = envFileError ? `Could not read ${fileURL(envFile)}.` : `No database URL in ${fileURL(envFile)}.`;
    throw new Error(
        `${reason} Set DATABASE_URL_UNPOOLED (direct, non-pooled) or DATABASE_URL in the environment, ` +
            `or add one to apps/api/.env.local. See apps/api/.env.example.`,
    );
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/schema.ts",
    out: "./drizzle",
    dbCredentials: { url },
});
