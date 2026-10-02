import { serve } from "@hono/node-server";

// Load local settings before anything reads process.env (Node 21.7+).
try {
  process.loadEnvFile(".env.local");
} catch {
  // no local env file
}

const { default: app } = await import("./index.js");

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}/v1`);
});
