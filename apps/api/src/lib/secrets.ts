import { newId, type SecretOpName } from "@repo/core";
import { DecryptionError, decryptValue, encryptValue, type EncryptedPayload, type KeyProvider } from "@repo/crypto";
import { and, changes, environments, eq, secretVersions, secrets, sql, type Executor } from "@repo/db";
import type { Context } from "hono";
import type { AppEnv, Principal } from "../context.js";
import { AppError, forbidden, notFound } from "../errors.js";
import { writeAudit } from "./audit.js";

export type SecretRow = typeof secrets.$inferSelect;

/** Who is making a write. Service tokens can never write. */
export interface Actor {
    type: "user" | "device";
    /** The user id, even for devices (devices act as their user). */
    userId: string;
    /** The user id or device id, recorded as `changed_by_id`. */
    id: string;
}

export function actorFromPrincipal(principal: Principal | null): Actor {
    if (!principal || principal.type === "service_token") throw forbidden();
    return principal.type === "user"
        ? { type: "user", userId: principal.userId, id: principal.userId }
        : { type: "device", userId: principal.userId, id: principal.deviceId };
}

export type SecretChange =
    | { op: "upsert"; key: string; value: string; baseVersion?: number }
    | { op: "delete"; key: string; baseVersion?: number };

export interface AppliedChange {
    secretId: string;
    key: string;
    version: number;
    op: SecretOpName;
    seq: number;
}

/** A write whose `baseVersion` did not match the server. Never silently overwritten. */
export class SecretConflictError extends AppError {
    readonly key: string;
    readonly serverVersion: number;
    readonly serverDeleted: boolean;

    constructor(key: string, serverVersion: number, serverDeleted: boolean) {
        super("SECRET_CONFLICT", "The secret was changed by someone else", {
            details: { key, serverVersion, serverDeleted },
        });
        this.key = key;
        this.serverVersion = serverVersion;
        this.serverDeleted = serverDeleted;
    }
}

/**
 * Bumps the environment's change counter and returns the new value.
 *
 * Must be the first statement of a write transaction: the UPDATE takes a row
 * lock on the environment that is held until commit, which serializes writers
 * per environment. That is what makes `seq` strictly increasing with no gaps
 * or out-of-order commits. If the transaction rolls back (conflict, error),
 * the increment rolls back with it.
 */
export async function nextSeq(tx: Executor, environmentId: string): Promise<number> {
    const [row] = await tx
        .update(environments)
        .set({ changeSeq: sql`${environments.changeSeq} + 1` })
        .where(eq(environments.id, environmentId))
        .returning({ seq: environments.changeSeq });
    if (!row) throw notFound("Environment not found");
    return row.seq;
}

async function findSecret(tx: Executor, environmentId: string, key: string): Promise<SecretRow | undefined> {
    const [row] = await tx
        .select()
        .from(secrets)
        .where(and(eq(secrets.environmentId, environmentId), eq(secrets.key, key)))
        .limit(1);
    return row;
}

async function recordVersion(
    tx: Executor,
    actor: Actor,
    environmentId: string,
    seq: number,
    secretId: string,
    key: string,
    version: number,
    op: SecretOpName,
    payload: EncryptedPayload,
): Promise<AppliedChange> {
    await tx.insert(secretVersions).values({
        secretId,
        version,
        ...payload,
        op,
        changedByType: actor.type,
        changedById: actor.id,
    });
    await tx.insert(changes).values({
        environmentId,
        seq,
        secretId,
        key,
        op,
        version,
    });
    return { secretId, key, version, op, seq };
}

/**
 * Encrypts `value` and writes it as the next version of `key`, creating,
 * updating or reviving (soft-deleted) the row. `existing` is the current row.
 * The caller must already hold the environment lock (see `nextSeq`).
 */
export async function commitUpsert(
    tx: Executor,
    keyProvider: KeyProvider,
    actor: Actor,
    environmentId: string,
    seq: number,
    existing: SecretRow | undefined,
    key: string,
    value: string,
): Promise<AppliedChange> {
    const secretId = existing?.id ?? newId();
    const payload = await encryptValue(keyProvider, value, {
        environmentId,
        secretId,
        key,
    });

    if (!existing) {
        await tx.insert(secrets).values({
            id: secretId,
            environmentId,
            key,
            ...payload,
            version: 1,
            createdBy: actor.userId,
            updatedBy: actor.userId,
        });
        return recordVersion(tx, actor, environmentId, seq, secretId, key, 1, "create", payload);
    }

    const version = existing.version + 1;
    // Re-creating a soft-deleted key revives the row and counts as a create.
    const op: SecretOpName = existing.deletedAt ? "create" : "update";
    await tx
        .update(secrets)
        .set({
            ...payload,
            version,
            deletedAt: null,
            updatedBy: actor.userId,
            updatedAt: new Date(),
        })
        .where(eq(secrets.id, existing.id));
    return recordVersion(tx, actor, environmentId, seq, secretId, key, version, op, payload);
}

/**
 * Applies one change inside the caller's transaction. This is the only write
 * path for secrets: PUT, DELETE, bulk import, rollback and sync push all use
 * it, so versioning, conflicts and the change log behave identically.
 */
export async function applySecretChange(
    tx: Executor,
    keyProvider: KeyProvider,
    actor: Actor,
    environmentId: string,
    change: SecretChange,
): Promise<AppliedChange> {
    const seq = await nextSeq(tx, environmentId);
    const existing = await findSecret(tx, environmentId, change.key);

    // A soft-deleted key keeps its version, so a stale client that still thinks
    // the key is live conflicts instead of resurrecting it.
    const currentVersion = existing?.version ?? 0;
    if (change.baseVersion !== undefined && change.baseVersion !== currentVersion) {
        throw new SecretConflictError(change.key, currentVersion, existing?.deletedAt != null);
    }

    if (change.op === "upsert") {
        return commitUpsert(tx, keyProvider, actor, environmentId, seq, existing, change.key, change.value);
    }

    if (!existing || existing.deletedAt) throw notFound("Secret not found");

    const version = existing.version + 1;
    await tx
        .update(secrets)
        .set({
            deletedAt: new Date(),
            version,
            updatedBy: actor.userId,
            updatedAt: new Date(),
        })
        .where(eq(secrets.id, existing.id));

    // The tombstone keeps the last value, so the version row has something to hold.
    const payload: EncryptedPayload = {
        ciphertext: existing.ciphertext,
        iv: existing.iv,
        authTag: existing.authTag,
        wrappedDek: existing.wrappedDek,
        masterKeyId: existing.masterKeyId,
    };
    return recordVersion(tx, actor, environmentId, seq, existing.id, change.key, version, "delete", payload);
}

/**
 * Decrypts a stored value. A failure is audited as `crypto.decrypt_failed`
 * (without any detail) and surfaces to the client as a plain 500.
 */
export async function decryptStored(
    c: Context<AppEnv>,
    workspaceId: string,
    environmentId: string,
    row: Pick<SecretRow, "id" | "key" | "ciphertext" | "iv" | "authTag" | "wrappedDek" | "masterKeyId">,
): Promise<string> {
    const { db, keyProvider } = c.get("deps");
    try {
        return await decryptValue(
            keyProvider,
            {
                ciphertext: row.ciphertext,
                iv: row.iv,
                authTag: row.authTag,
                wrappedDek: row.wrappedDek,
                masterKeyId: row.masterKeyId,
            },
            { environmentId, secretId: row.id, key: row.key },
        );
    } catch (err) {
        if (err instanceof DecryptionError) {
            await writeAudit(db, c, {
                workspaceId,
                action: "crypto.decrypt_failed",
                targetType: "secret",
                targetId: row.id,
                metadata: { environmentId, key: row.key },
            });
        }
        throw new Error("Decryption failed");
    }
}
