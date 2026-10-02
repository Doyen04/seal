import { rateLimits, lt, sql, type Database } from "@repo/db";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../context.js";
import { AppError } from "../errors.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fixed-window counter in Postgres. Returns the count after this hit and the
 * seconds until the window resets.
 */
export async function hitRateLimit(
  db: Database,
  key: string,
  windowSeconds: number,
): Promise<{ count: number; retryAfterSeconds: number }> {
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  // Opportunistic cleanup so the table does not grow forever.
  if (Math.random() < 0.01) {
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, new Date(now - ONE_DAY_MS)));
  }

  return {
    count: row?.count ?? 1,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((windowStart.getTime() + windowMs - now) / 1000),
    ),
  };
}

/** Throws RATE_LIMITED once `identifier` exceeds `limit` hits in the window. */
export async function enforceRateLimit(
  c: Context<AppEnv>,
  name: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const { db } = c.get("deps");
  const { count, retryAfterSeconds } = await hitRateLimit(
    db,
    `${name}:${identifier}`,
    windowSeconds,
  );
  if (count > limit) {
    throw new AppError("RATE_LIMITED", "Too many requests, try again later", {
      details: { retryAfterSeconds },
      headers: { "Retry-After": String(retryAfterSeconds) },
    });
  }
}

/** Per-IP rate limit for a named route. */
export const ipRateLimit = (name: string, limit: number, windowSeconds: number) =>
  createMiddleware<AppEnv>(async (c, next) => {
    await enforceRateLimit(c, name, `ip:${c.get("ip")}`, limit, windowSeconds);
    await next();
  });
