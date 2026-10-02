import { Hono } from "hono";

const app = new Hono().basePath("/v1");

app.get("/health", (c) => c.json({ ok: true }));

export default app;
