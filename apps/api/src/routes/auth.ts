import {
    deviceLoginSchema,
    forgotPasswordSchema,
    loginSchema,
    resetPasswordSchema,
    signupSchema,
    verifyEmailSchema,
    type DeviceLoginResponse,
} from "@repo/core";
import { generateToken, hashPassword } from "@repo/crypto";
import { devices, eq, sessions, sql, users } from "@repo/db";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../context.js";
import { resetPasswordMessage, verifyEmailMessage } from "../email/templates.js";
import { validationError } from "../errors.js";
import { parseJson } from "../http.js";
import { RESET_TOKEN_TTL_MS, VERIFY_TOKEN_TTL_MS, consumeEmailToken, createEmailToken } from "../lib/email-tokens.js";
import { assertPasswordAllowed, toUserDto, verifyCredentials } from "../lib/users.js";
import { SESSION_COOKIE, requireAuth } from "../middleware/authenticate.js";
import { enforceRateLimit, ipRateLimit } from "../middleware/rate-limit.js";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const FIFTEEN_MINUTES = 15 * 60;
const ONE_HOUR = 60 * 60;

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/signup", ipRateLimit("signup", 5, ONE_HOUR), async (c) => {
    const body = await parseJson(c, signupSchema);
    assertPasswordAllowed(body.password);
    const { db, env, email } = c.get("deps");

    // Hash before looking the user up so existing and new emails take similar time.
    const passwordHash = await hashPassword(body.password);

    const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);

    let verifyUserId: string | null = null;
    if (!existing) {
        const [created] = await db
            .insert(users)
            .values({ email: body.email, passwordHash, name: body.name })
            .onConflictDoNothing()
            .returning({ id: users.id });
        verifyUserId = created?.id ?? null;
    } else if (!existing.emailVerifiedAt) {
        // Lets someone who lost the first email try again.
        verifyUserId = existing.id;
    }

    if (verifyUserId) {
        const token = await createEmailToken(db, verifyUserId, "verify", VERIFY_TOKEN_TTL_MS);
        await email.send(verifyEmailMessage(body.email, env.WEB_ORIGIN, token));
    }

    // Same response whether or not the address was already registered.
    return c.json({ ok: true }, 201);
});

authRoutes.post("/verify-email", async (c) => {
    const body = await parseJson(c, verifyEmailSchema);
    const { db } = c.get("deps");

    const userId = await consumeEmailToken(db, body.token, "verify");
    if (!userId) {
        throw validationError("This link is invalid or has expired");
    }
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));

    return c.json({ ok: true });
});

authRoutes.post("/login", ipRateLimit("login", 10, FIFTEEN_MINUTES), async (c) => {
    const body = await parseJson(c, loginSchema);
    await enforceRateLimit(c, "login", `acct:${body.email}`, 10, FIFTEEN_MINUTES);
    const { db } = c.get("deps");

    const user = await verifyCredentials(db, body.email, body.password);

    const { token, hash } = generateToken("session");
    await db.insert(sessions).values({
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
        ip: c.get("ip"),
        userAgent: c.req.header("user-agent")?.slice(0, 500) ?? null,
    });

    setCookie(c, SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
    });

    return c.json({ user: toUserDto(user) });
});

authRoutes.post("/logout", requireAuth("user"), async (c) => {
    const principal = c.get("principal");
    if (principal?.type === "user") {
        await c.get("deps").db.delete(sessions).where(eq(sessions.id, principal.sessionId));
    }
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ ok: true });
});

authRoutes.post("/device-login", ipRateLimit("device-login", 10, FIFTEEN_MINUTES), async (c) => {
    const body = await parseJson(c, deviceLoginSchema);
    await enforceRateLimit(c, "device-login", `acct:${body.email}`, 10, FIFTEEN_MINUTES);
    const { db } = c.get("deps");

    const user = await verifyCredentials(db, body.email, body.password);

    const { token, hash } = generateToken("device");
    await db.insert(devices).values({
        userId: user.id,
        name: body.deviceName,
        platform: body.platform,
        tokenHash: hash,
    });

    const response: DeviceLoginResponse = {
        deviceToken: token,
        user: toUserDto(user),
    };
    return c.json(response, 201);
});

authRoutes.post("/forgot-password", ipRateLimit("forgot-password", 5, ONE_HOUR), async (c) => {
    const body = await parseJson(c, forgotPasswordSchema);
    await enforceRateLimit(c, "forgot-password", `acct:${body.email}`, 5, ONE_HOUR);
    const { db, env, email } = c.get("deps");

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);

    if (user) {
        const token = await createEmailToken(db, user.id, "reset", RESET_TOKEN_TTL_MS);
        await email.send(resetPasswordMessage(body.email, env.WEB_ORIGIN, token));
    }

    // Always the same answer, so this cannot be used to find registered emails.
    return c.json({ ok: true });
});

authRoutes.post("/reset-password", async (c) => {
    const body = await parseJson(c, resetPasswordSchema);
    assertPasswordAllowed(body.password);
    const { db } = c.get("deps");

    const passwordHash = await hashPassword(body.password);

    const userId = await consumeEmailToken(db, body.token, "reset");
    if (!userId) {
        throw validationError("This link is invalid or has expired");
    }

    // Following the emailed link also proves the user owns the address.
    await db
        .update(users)
        .set({
            passwordHash,
            emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
        })
        .where(eq(users.id, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId));

    return c.json({ ok: true });
});
