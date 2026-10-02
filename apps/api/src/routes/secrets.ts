import {
    bulkSecretsSchema,
    deleteSecretSchema,
    putSecretSchema,
    rollbackSecretSchema,
    secretKeySchema,
    type BulkWriteResponse,
    type ExportResponse,
    type SecretMetaDto,
    type SecretValueDto,
    type SecretVersionDto,
    type SecretWriteResultDto,
} from "@repo/core";
import { and, desc, environments, eq, isNull, secretVersions, secrets, users } from "@repo/db";
import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../context.js";
import { notFound, validationError } from "../errors.js";
import { isUuid, parseJson, parseOptionalJson } from "../http.js";
import { writeAudit } from "../lib/audit.js";
import { authorizeEnvironment } from "../lib/environments.js";
import {
    actorFromPrincipal,
    applySecretChange,
    commitUpsert,
    decryptStored,
    nextSeq,
    type AppliedChange,
} from "../lib/secrets.js";
import { requireAuth } from "../middleware/authenticate.js";
import { enforceRateLimit } from "../middleware/rate-limit.js";

const anyUser = requireAuth("user", "device");
const userOrToken = requireAuth("user", "device", "service_token");

function parseKey(c: Context<AppEnv>): string {
    const result = secretKeySchema.safeParse(c.req.param("key"));
    if (!result.success) throw validationError("Invalid secret key");
    return result.data;
}

function toResult(applied: AppliedChange): SecretWriteResultDto {
    return {
        key: applied.key,
        version: applied.version,
        op: applied.op,
        seq: applied.seq,
    };
}

async function loadSecretById(c: Context<AppEnv>, id: string) {
    if (!isUuid(id)) throw notFound("Secret not found");
    const [row] = await c.get("deps").db.select().from(secrets).where(eq(secrets.id, id)).limit(1);
    if (!row) throw notFound("Secret not found");
    return row;
}

export const secretRoutes = new Hono<AppEnv>();

// Metadata only: never selects or returns ciphertext or values.
secretRoutes.get("/environments/:eid/secrets", anyUser, async (c) => {
    const env = await authorizeEnvironment(c, c.req.param("eid"), "read");
    const { db } = c.get("deps");

    const rows = await db
        .select({
            id: secrets.id,
            key: secrets.key,
            version: secrets.version,
            updatedAt: secrets.updatedAt,
            updatedById: users.id,
            updatedByName: users.name,
        })
        .from(secrets)
        .innerJoin(users, eq(users.id, secrets.updatedBy))
        .where(and(eq(secrets.environmentId, env.id), isNull(secrets.deletedAt)))
        .orderBy(secrets.key);

    const response: { secrets: SecretMetaDto[] } = {
        secrets: rows.map((row) => ({
            id: row.id,
            key: row.key,
            version: row.version,
            updatedAt: row.updatedAt.toISOString(),
            updatedBy: { id: row.updatedById, name: row.updatedByName },
        })),
    };
    return c.json(response);
});

secretRoutes.get("/environments/:eid/secrets/:key", anyUser, async (c) => {
    const env = await authorizeEnvironment(c, c.req.param("eid"), "read");
    const key = parseKey(c);
    const { db } = c.get("deps");

    const [row] = await db
        .select()
        .from(secrets)
        .where(and(eq(secrets.environmentId, env.id), eq(secrets.key, key), isNull(secrets.deletedAt)))
        .limit(1);
    if (!row) throw notFound("Secret not found");

    const value = await decryptStored(c, env.workspaceId, env.id, row);
    await writeAudit(db, c, {
        workspaceId: env.workspaceId,
        action: "secret.read",
        targetType: "secret",
        targetId: row.id,
        metadata: { key, version: row.version },
    });

    const response: SecretValueDto = { key, value, version: row.version };
    return c.json(response);
});

secretRoutes.put("/environments/:eid/secrets/:key", anyUser, async (c) => {
    const env = await authorizeEnvironment(c, c.req.param("eid"), "write");
    const key = parseKey(c);
    const body = await parseJson(c, putSecretSchema);
    const actor = actorFromPrincipal(c.get("principal"));
    const { db, keyProvider } = c.get("deps");

    const applied = await db.transaction(async (tx) => {
        const result = await applySecretChange(tx, keyProvider, actor, env.id, {
            op: "upsert",
            key,
            value: body.value,
            ...(body.baseVersion !== undefined ? { baseVersion: body.baseVersion } : {}),
        });
        await writeAudit(tx, c, {
            workspaceId: env.workspaceId,
            action: `secret.${result.op}`,
            targetType: "secret",
            targetId: result.secretId,
            metadata: { key, version: result.version },
        });
        return result;
    });

    return c.json(toResult(applied), applied.op === "create" ? 201 : 200);
});

secretRoutes.delete("/environments/:eid/secrets/:key", anyUser, async (c) => {
    const env = await authorizeEnvironment(c, c.req.param("eid"), "write");
    const key = parseKey(c);
    const body = await parseOptionalJson(c, deleteSecretSchema);
    const actor = actorFromPrincipal(c.get("principal"));
    const { db, keyProvider } = c.get("deps");

    const applied = await db.transaction(async (tx) => {
        const result = await applySecretChange(tx, keyProvider, actor, env.id, {
            op: "delete",
            key,
            ...(body.baseVersion !== undefined ? { baseVersion: body.baseVersion } : {}),
        });
        await writeAudit(tx, c, {
            workspaceId: env.workspaceId,
            action: "secret.delete",
            targetType: "secret",
            targetId: result.secretId,
            metadata: { key, version: result.version },
        });
        return result;
    });

    return c.json(toResult(applied));
});

// All-or-nothing: any conflict or error rolls back every item.
secretRoutes.post("/environments/:eid/secrets/bulk", anyUser, async (c) => {
    const env = await authorizeEnvironment(c, c.req.param("eid"), "write");
    const body = await parseJson(c, bulkSecretsSchema);
    const actor = actorFromPrincipal(c.get("principal"));
    const { db, keyProvider } = c.get("deps");

    const applied = await db.transaction(async (tx) => {
        const results: AppliedChange[] = [];
        for (const item of body.items) {
            results.push(
                await applySecretChange(tx, keyProvider, actor, env.id, {
                    op: "upsert",
                    key: item.key,
                    value: item.value,
                    ...(item.baseVersion !== undefined ? { baseVersion: item.baseVersion } : {}),
                }),
            );
        }
        await writeAudit(tx, c, {
            workspaceId: env.workspaceId,
            action: "secrets.bulk_write",
            targetType: "environment",
            targetId: env.id,
            metadata: {
                count: results.length,
                items: results.map((r) => ({ key: r.key, version: r.version, op: r.op })),
            },
        });
        return results;
    });

    const response: BulkWriteResponse = {
        applied: applied.map(toResult),
        latestSeq: applied[applied.length - 1]?.seq ?? 0,
    };
    return c.json(response);
});

secretRoutes.get("/environments/:eid/export", userOrToken, async (c) => {
    const principal = c.get("principal");
    if (principal) {
        const id = principal.type === "service_token" ? principal.tokenId : principal.userId;
        await enforceRateLimit(c, "export", id, 120, 60);
    }

    const env = await authorizeEnvironment(c, c.req.param("eid"), "read");
    const { db } = c.get("deps");

    // One snapshot, so `seq` matches exactly the secrets returned with it.
    const snapshot = await db.transaction(
        async (tx) => {
            const [envRow] = await tx
                .select({ seq: environments.changeSeq })
                .from(environments)
                .where(eq(environments.id, env.id))
                .limit(1);
            const rows = await tx
                .select()
                .from(secrets)
                .where(and(eq(secrets.environmentId, env.id), isNull(secrets.deletedAt)));
            return { seq: envRow?.seq ?? 0, rows };
        },
        { isolationLevel: "repeatable read" },
    );

    const values: Record<string, string> = {};
    for (const row of snapshot.rows) {
        values[row.key] = await decryptStored(c, env.workspaceId, env.id, row);
    }

    await writeAudit(db, c, {
        workspaceId: env.workspaceId,
        action: "secrets.export",
        targetType: "environment",
        targetId: env.id,
        metadata: { count: snapshot.rows.length, seq: snapshot.seq },
    });

    const response: ExportResponse = {
        secrets: values,
        seq: snapshot.seq,
        offlineMaxAgeHours: env.offlineMaxAgeHours,
    };
    return c.json(response);
});

secretRoutes.get("/secrets/:id/versions", anyUser, async (c) => {
    const secret = await loadSecretById(c, c.req.param("id"));
    await authorizeEnvironment(c, secret.environmentId, "read", "Secret not found");
    const { db } = c.get("deps");

    // Metadata only: no ciphertext columns are selected.
    const rows = await db
        .select({
            version: secretVersions.version,
            op: secretVersions.op,
            changedByType: secretVersions.changedByType,
            changedById: secretVersions.changedById,
            createdAt: secretVersions.createdAt,
        })
        .from(secretVersions)
        .where(eq(secretVersions.secretId, secret.id))
        .orderBy(desc(secretVersions.version));

    const response: { versions: SecretVersionDto[] } = {
        versions: rows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
        })),
    };
    return c.json(response);
});

secretRoutes.post("/secrets/:id/rollback", anyUser, async (c) => {
    const secret = await loadSecretById(c, c.req.param("id"));
    const env = await authorizeEnvironment(c, secret.environmentId, "write", "Secret not found");
    const body = await parseJson(c, rollbackSecretSchema);
    const actor = actorFromPrincipal(c.get("principal"));
    const { db, keyProvider } = c.get("deps");

    const applied = await db.transaction(async (tx) => {
        const seq = await nextSeq(tx, env.id);

        const [current] = await tx.select().from(secrets).where(eq(secrets.id, secret.id)).limit(1);
        if (!current) throw notFound("Secret not found");

        const [target] = await tx
            .select()
            .from(secretVersions)
            .where(and(eq(secretVersions.secretId, secret.id), eq(secretVersions.version, body.version)))
            .limit(1);
        if (!target) throw notFound("Version not found");
        if (target.op === "delete") {
            throw validationError("That version is a deletion and has no value to restore");
        }

        const value = await decryptStored(c, env.workspaceId, env.id, {
            id: current.id,
            key: current.key,
            ciphertext: target.ciphertext,
            iv: target.iv,
            authTag: target.authTag,
            wrappedDek: target.wrappedDek,
            masterKeyId: target.masterKeyId,
        });

        // Re-encrypted with a fresh DEK and the current master key.
        const result = await commitUpsert(tx, keyProvider, actor, env.id, seq, current, current.key, value);
        await writeAudit(tx, c, {
            workspaceId: env.workspaceId,
            action: "secret.rollback",
            targetType: "secret",
            targetId: current.id,
            metadata: {
                key: current.key,
                restoredVersion: target.version,
                version: result.version,
            },
        });
        return result;
    });

    return c.json(toResult(applied));
});
