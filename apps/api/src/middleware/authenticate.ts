import { hashesEqual, hashToken, tokenKindFromPrefix } from "@repo/crypto";
import {
  and,
  devices,
  eq,
  gt,
  serviceTokens,
  sessions,
  users,
  type Database,
} from "@repo/db";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AppEnv, Principal, PrincipalType } from "../context.js";
import { AppError, forbidden, unauthenticated } from "../errors.js";

export const SESSION_COOKIE = "seal_session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const LAST_SEEN_THROTTLE_MS = 60_000;

async function resolveDevice(db: Database, token: string): Promise<Principal> {
  const hash = hashToken(token);
  const [row] = await db
    .select({ device: devices, user: users })
    .from(devices)
    .innerJoin(users, eq(users.id, devices.userId))
    .where(eq(devices.tokenHash, hash))
    .limit(1);

  if (!row || !hashesEqual(row.device.tokenHash, hash)) {
    throw unauthenticated("Invalid token");
  }
  if (row.device.revokedAt) {
    throw new AppError("TOKEN_REVOKED", "This device has been revoked");
  }

  const lastSeen = row.device.lastSeenAt?.getTime() ?? 0;
  if (Date.now() - lastSeen > LAST_SEEN_THROTTLE_MS) {
    await db
      .update(devices)
      .set({ lastSeenAt: new Date() })
      .where(eq(devices.id, row.device.id));
  }

  return { type: "device", userId: row.user.id, deviceId: row.device.id };
}

async function resolveServiceToken(
  db: Database,
  token: string,
  ip: string,
): Promise<Principal> {
  const hash = hashToken(token);
  const [row] = await db
    .select()
    .from(serviceTokens)
    .where(eq(serviceTokens.tokenHash, hash))
    .limit(1);

  if (!row || !hashesEqual(row.tokenHash, hash)) {
    throw unauthenticated("Invalid token");
  }
  if (row.revokedAt) {
    throw new AppError("TOKEN_REVOKED", "This token has been revoked");
  }
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    throw new AppError("TOKEN_EXPIRED", "This token has expired");
  }
  if (row.ipAllowlist && row.ipAllowlist.length > 0) {
    if (!row.ipAllowlist.includes(ip)) {
      throw forbidden("This token cannot be used from your IP address");
    }
  }

  await db
    .update(serviceTokens)
    .set({ lastUsedAt: new Date(), lastUsedIp: ip })
    .where(eq(serviceTokens.id, row.id));

  return {
    type: "service_token",
    tokenId: row.id,
    environmentId: row.environmentId,
  };
}

/** Returns null for an unknown or expired session so public routes still work. */
async function resolveSession(
  db: Database,
  token: string,
): Promise<Principal | null> {
  const hash = hashToken(token);
  const [row] = await db
    .select({ session: sessions })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, hash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row || !hashesEqual(row.session.tokenHash, hash)) {
    return null;
  }
  return { type: "user", userId: row.session.userId, sessionId: row.session.id };
}

/** CSRF defense: cookie-authenticated writes must come from the web origin. */
function assertSameOrigin(c: Context<AppEnv>): void {
  if (SAFE_METHODS.has(c.req.method)) return;
  const expected = new URL(c.get("deps").env.WEB_ORIGIN).origin;
  if (c.req.header("origin") !== expected) {
    throw forbidden("Invalid request origin");
  }
}

/**
 * Resolves the request to one principal (or none). Bearer tokens take
 * priority over the session cookie; there is no fallback between them.
 */
export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const { db } = c.get("deps");
  let principal: Principal | null = null;

  const authorization = c.req.header("authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw unauthenticated("Invalid authorization header");
    }
    const kind = tokenKindFromPrefix(token);
    if (kind === "device") {
      principal = await resolveDevice(db, token);
    } else if (kind === "service") {
      principal = await resolveServiceToken(db, token, c.get("ip"));
    } else {
      throw unauthenticated("Invalid token");
    }
  } else {
    const sessionToken = getCookie(c, SESSION_COOKIE);
    if (sessionToken) {
      principal = await resolveSession(db, sessionToken);
      if (principal) assertSameOrigin(c);
    }
  }

  c.set("principal", principal);
  await next();
});

/** Route guard: the request must carry one of the allowed principal types. */
export const requireAuth = (...allowed: PrincipalType[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const principal = c.get("principal");
    if (!principal) throw unauthenticated();
    if (!allowed.includes(principal.type)) {
      throw forbidden("This credential cannot be used for this endpoint");
    }
    await next();
  });

/** For routes guarded by `requireAuth("user", "device")`. */
export function getUserPrincipal(
  c: Context<AppEnv>,
): Extract<Principal, { type: "user" | "device" }> {
  const principal = c.get("principal");
  if (!principal || principal.type === "service_token") {
    throw unauthenticated();
  }
  return principal;
}
