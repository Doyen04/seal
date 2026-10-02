import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import type { z } from "zod";
import { validationError } from "./errors.js";

/**
 * Best-effort client IP. On Vercel the platform sets `x-forwarded-for` itself.
 * Elsewhere (local dev) fall back to the socket address.
 */
export function getClientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = c.req.header("x-real-ip");
  if (real) return real;
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** Parses and validates a JSON body. Error details never echo input values. */
export async function parseJson<T extends z.ZodType>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw validationError("Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw validationError("Invalid request", {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

/** Like `parseJson`, but an empty body is treated as `{}`. */
export async function parseOptionalJson<T extends z.ZodType>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  const text = await c.req.text();
  let raw: unknown = {};
  if (text.trim() !== "") {
    try {
      raw = JSON.parse(text);
    } catch {
      throw validationError("Request body must be valid JSON");
    }
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw validationError("Invalid request", {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

/** Parses and validates the query string. */
export function parseQuery<T extends z.ZodType>(
  c: Context,
  schema: T,
): z.infer<T> {
  const result = schema.safeParse(c.req.query());
  if (!result.success) {
    throw validationError("Invalid query parameters", {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
