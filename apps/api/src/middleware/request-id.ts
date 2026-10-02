import { randomUUID } from "node:crypto";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../context.js";

/** Always generates its own id; a client-supplied one could poison logs. */
export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const id = randomUUID();
  c.set("requestId", id);
  c.header("X-Request-Id", id);
  await next();
});
