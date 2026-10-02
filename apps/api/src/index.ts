import { Hono } from "hono";
import { createApp } from "./app.js";
import { createDeps, type Deps } from "./deps.js";

let deps: Deps | undefined;
const getDeps = () => (deps ??= createDeps());

// Vercel looks for a default-exported Hono app in src/index.ts.
const app = new Hono();
app.route("/", createApp(getDeps));

export default app;
