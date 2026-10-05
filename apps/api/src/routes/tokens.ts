import { createServiceTokenSchema, type CreateServiceTokenResponse, type ServiceTokenDto } from "@repo/core";
import { generateToken, tokenLast4, tokenPrefix } from "@repo/crypto";
import { desc, eq, serviceTokens } from "@repo/db";
import { Hono } from "hono";
import type { AppEnv } from "../context.js";
import { notFound, validationError } from "../errors.js";
import { isUuid, parseJson } from "../http.js";
import { writeAudit } from "../lib/audit.js";
import { authorizeEnvironment } from "../lib/environments.js";
import { getUserPrincipal, requireAuth } from "../middleware/authenticate.js";

const anyUser = requireAuth("user", "device");

/** Only the fields that may leave the server. `tokenHash` is deliberately absent. */
type TokenRow = Pick<
    typeof serviceTokens.$inferSelect,
    "id" | "name" | "prefix" | "last4" | "expiresAt" | "lastUsedAt" | "lastUsedIp" | "ipAllowlist" | "createdAt"
>;

/**
 * Never includes `tokenHash`. The plaintext token exists only in the response to
 * the create call and cannot be recovered afterwards.
 */
function toDto(row: TokenRow): ServiceTokenDto {
    return {
        id: row.id,
        name: row.name,
        prefix: row.prefix,
        last4: row.last4,
        expiresAt: row.expiresAt?.toISOString() ?? null,
        lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
        lastUsedIp: row.lastUsedIp,
        ipAllowlist: row.ipAllowlist,
        createdAt: row.createdAt.toISOString(),
    };
}

export const tokenRoutes = new Hono<AppEnv>();

tokenRoutes.post("/environments/:eid/tokens", anyUser, async (c) => {
    const env = await authorizeEnvironment(c, c.req.param("eid"), "write");
    const body = await parseJson(c, createServiceTokenSchema);
    // Service tokens cannot mint more service tokens.
    const principal = getUserPrincipal(c);
    const { db } = c.get("deps");

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw validationError("Expiry must be in the future");
    }

    const { token, hash } = generateToken("service");

    const [row] = await db
        .insert(serviceTokens)
        .values({
            environmentId: env.id,
            name: body.name,
            tokenHash: hash,
            prefix: tokenPrefix(token),
            last4: tokenLast4(token),
            expiresAt,
            ipAllowlist: body.ipAllowlist ?? null,
            // A device acts as its owning user, which is what the column references.
            createdBy: principal.userId,
        })
        .returning();

    if (!row) throw new Error("Service token insert returned no row");

    await writeAudit(db, c, {
        workspaceId: env.workspaceId,
        action: "token.create",
        targetType: "service_token",
        targetId: row.id,
        metadata: {
            name: row.name,
            environmentId: env.id,
            expiresAt: row.expiresAt?.toISOString() ?? null,
            ipRestricted: (row.ipAllowlist?.length ?? 0) > 0,
        },
    });

    const response: CreateServiceTokenResponse = {
        id: row.id,
        name: row.name,
        token,
        prefix: row.prefix,
        last4: row.last4,
    };
    return c.json(response, 201);
});

// Metadata only: the token hash column is never selected.
tokenRoutes.get("/environments/:eid/tokens", anyUser, async (c) => {
    const env = await authorizeEnvironment(c, c.req.param("eid"), "read");
    const { db } = c.get("deps");

    const rows = await db
        .select({
            id: serviceTokens.id,
            name: serviceTokens.name,
            prefix: serviceTokens.prefix,
            last4: serviceTokens.last4,
            expiresAt: serviceTokens.expiresAt,
            lastUsedAt: serviceTokens.lastUsedAt,
            lastUsedIp: serviceTokens.lastUsedIp,
            ipAllowlist: serviceTokens.ipAllowlist,
            createdAt: serviceTokens.createdAt,
        })
        .from(serviceTokens)
        .where(eq(serviceTokens.environmentId, env.id))
        .orderBy(desc(serviceTokens.createdAt), desc(serviceTokens.id));

    return c.json({ tokens: rows.map(toDto) });
});

tokenRoutes.delete("/tokens/:id", anyUser, async (c) => {
    const id = c.req.param("id");
    // Same message for a malformed id and one that does not exist, so ids in
    // other tenants cannot be probed.
    if (!id || !isUuid(id)) throw notFound("Token not found");
    const { db } = c.get("deps");

    const [row] = await db.select().from(serviceTokens).where(eq(serviceTokens.id, id)).limit(1);
    if (!row) throw notFound("Token not found");
    const env = await authorizeEnvironment(c, row.environmentId, "write", "Token not found");

    // Revoking twice is not an error.
    if (row.revokedAt) return c.json({ ok: true } as const);

    await db.update(serviceTokens).set({ revokedAt: new Date() }).where(eq(serviceTokens.id, id));
    await writeAudit(db, c, {
        workspaceId: env.workspaceId,
        action: "token.revoke",
        targetType: "service_token",
        targetId: row.id,
        metadata: { name: row.name, environmentId: env.id },
    });

    return c.json({ ok: true } as const);
});
