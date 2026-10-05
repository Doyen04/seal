import { Hono } from "hono";
import { createApp } from "./build-app.js";
import { createDeps, type Deps } from "./deps.js";

let deps: Deps | undefined;
const getDeps = () => (deps ??= createDeps());

// Vercel bundles the first of src/app.*, src/index.* or src/server.* it finds,
// so this file must stay the only entrypoint candidate and must default-export
// the Hono app. The factory lives in build-app.ts to keep that name free.
// `index.test.ts` enforces both rules.
const app = new Hono();
app.route("/", createApp(getDeps));

export default app;
