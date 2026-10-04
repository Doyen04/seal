import { serve } from "@hono/node-server";
import { config as loadEnvFile } from "dotenv";

// Turborepo does not load .env files into a task's runtime, and Strict Mode
// passes only the variables declared for this task, so the file is loaded here.
// Resolved from this module rather than process.cwd(). dotenv does not override
// variables that are already set, so a shell export still wins.
loadEnvFile({ path: new URL("../.env.local", import.meta.url), quiet: true });

const { default: app } = await import("./index.js");

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
    console.log(`api listening on http://localhost:${info.port}/v1`);
});
