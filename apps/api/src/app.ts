import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "./context.js";
import type { Deps } from "./deps.js";
import { ConfigError } from "./env.js";
import { AppError } from "./errors.js";
import { getClientIp } from "./http.js";
import { authenticate } from "./middleware/authenticate.js";
import { requestId } from "./middleware/request-id.js";
import { accountRoutes } from "./routes/account.js";
import { authRoutes } from "./routes/auth.js";

/**
 * Builds the API. `getDeps` is called lazily on the first request that needs
 * it, so `/health` keeps working even when configuration is broken.
 *
 * Middleware order: request id, (rate limit per route), authenticate,
 * authorize (per route), handler.
 */
export function createApp(getDeps: () => Deps) {
  const app = new Hono<AppEnv>().basePath("/v1");

  app.use(requestId);
  app.use(async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  });

  // Registered before the deps/auth middleware on purpose: no auth, no DB.
  app.get("/health", (c) => c.json({ ok: true }));

  app.use(async (c, next) => {
    c.set("deps", getDeps());
    c.set("ip", getClientIp(c));
    c.set("principal", null);
    await next();
  });

  app.use(
    cors({
      origin: (origin, c) =>
        origin === new URL(c.get("deps").env.WEB_ORIGIN).origin ? origin : null,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(authenticate);

  app.route("/auth", authRoutes);
  app.route("/", accountRoutes);

  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404),
  );

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(err.toBody(), err.status as ContentfulStatusCode, err.headers);
    }
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    // Log the error type only: messages from drivers can contain row data.
    // Configuration errors are safe to print (they list variable names).
    console.error(
      JSON.stringify({
        requestId: c.get("requestId"),
        error: err.name,
        ...(err instanceof ConfigError ? { message: err.message } : {}),
      }),
    );
    return c.json(
      { error: { code: "INTERNAL", message: "Internal server error" } },
      500,
    );
  });

  return app;
}
