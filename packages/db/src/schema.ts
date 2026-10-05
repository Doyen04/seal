// The whole schema lives in one file on purpose: drizzle-kit cannot resolve
// schema files that import each other with ".js" suffixes (NodeNext style).
import { newId } from "@repo/core/id";
import {
    ACCESS_OVERRIDES,
    ACTOR_TYPES,
    DEFAULT_OFFLINE_MAX_AGE_HOURS,
    EMAIL_TOKEN_TYPES,
    INTEGRATION_PROVIDERS,
    MAPPING_STATUSES,
    ROLES,
    SECRET_OPS,
    SYNC_JOB_STATUSES,
    VERCEL_TARGETS,
    type AccessOverride,
    type ActorType,
    type EmailTokenType,
    type IntegrationProvider,
    type MappingStatus,
    type Role,
    type SecretOp,
    type SyncJobStatus,
    type VercelTarget,
} from "@repo/core/constants";
import { sql, type AnyColumn, type SQL } from "drizzle-orm";
import {
    bigint,
    boolean,
    check,
    customType,
    index,
    integer,
    jsonb,
    pgTable,
    primaryKey,
    text,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Column helpers
// ---------------------------------------------------------------------------

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
    dataType: () => "bytea",
});

/** Case-insensitive text. Requires the `citext` extension (see migration 0000). */
const citext = customType<{ data: string; driverData: string }>({
    dataType: () => "citext",
});

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

const id = () =>
    uuid("id")
        .primaryKey()
        .$defaultFn(() => newId());

const createdAt = () => timestamptz("created_at").notNull().defaultNow();

/** `column IN ('a', 'b')` built from trusted constants, for CHECK constraints. */
function oneOf(column: AnyColumn, values: readonly string[]): SQL {
    const list = values.map((v) => `'${v}'`).join(", ");
    return sql`${column} in (${sql.raw(list)})`;
}

/** The envelope-encryption fields shared by secrets, versions and credentials. */
const encryptedColumns = () => ({
    ciphertext: bytea("ciphertext").notNull(),
    iv: bytea("iv").notNull(),
    authTag: bytea("auth_tag").notNull(),
    wrappedDek: bytea("wrapped_dek").notNull(),
    masterKeyId: text("master_key_id").notNull(),
});

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
    id: id(),
    email: citext("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    emailVerifiedAt: timestamptz("email_verified_at"),
    createdAt: createdAt(),
});

export const sessions = pgTable(
    "sessions",
    {
        id: id(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        tokenHash: text("token_hash").notNull().unique(),
        expiresAt: timestamptz("expires_at").notNull(),
        ip: text("ip"),
        userAgent: text("user_agent"),
        createdAt: createdAt(),
    },
    (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const emailTokens = pgTable(
    "email_tokens",
    {
        id: id(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<EmailTokenType>().notNull(),
        tokenHash: text("token_hash").notNull().unique(),
        expiresAt: timestamptz("expires_at").notNull(),
        usedAt: timestamptz("used_at"),
        createdAt: createdAt(),
    },
    (t) => [
        index("email_tokens_user_id_idx").on(t.userId),
        check("email_tokens_type_check", oneOf(t.type, EMAIL_TOKEN_TYPES)),
    ],
);

export const devices = pgTable(
    "devices",
    {
        id: id(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        platform: text("platform").notNull(),
        tokenHash: text("token_hash").notNull().unique(),
        lastSeenAt: timestamptz("last_seen_at"),
        revokedAt: timestamptz("revoked_at"),
        createdAt: createdAt(),
    },
    (t) => [index("devices_user_id_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Teams and structure
// ---------------------------------------------------------------------------

export const workspaces = pgTable(
    "workspaces",
    {
        id: id(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => users.id),
        createdAt: createdAt(),
    },
    (t) => [index("workspaces_created_by_idx").on(t.createdBy)],
);

export const workspaceMembers = pgTable(
    "workspace_members",
    {
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        role: text("role").$type<Role>().notNull(),
        createdAt: createdAt(),
    },
    (t) => [
        primaryKey({ columns: [t.workspaceId, t.userId] }),
        index("workspace_members_user_id_idx").on(t.userId),
        check("workspace_members_role_check", oneOf(t.role, ROLES)),
    ],
);

export const invitations = pgTable(
    "invitations",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        email: citext("email").notNull(),
        role: text("role").$type<Role>().notNull(),
        tokenHash: text("token_hash").notNull().unique(),
        expiresAt: timestamptz("expires_at").notNull(),
        acceptedAt: timestamptz("accepted_at"),
        // Per-environment permissions chosen by the inviter. Held here because
        // environment_access is keyed by user id, which does not exist until the
        // recipient accepts and signs in.
        accessOverrides: jsonb("access_overrides")
            .$type<{ environmentId: string; access: AccessOverride }[]>()
            .notNull()
            .default([]),
        invitedBy: uuid("invited_by")
            .notNull()
            .references(() => users.id),
        createdAt: createdAt(),
    },
    (t) => [
        index("invitations_workspace_id_idx").on(t.workspaceId),
        index("invitations_invited_by_idx").on(t.invitedBy),
        check("invitations_role_check", oneOf(t.role, ROLES)),
    ],
);

export const projects = pgTable(
    "projects",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        offlineMaxAgeHours: integer("offline_max_age_hours").notNull().default(DEFAULT_OFFLINE_MAX_AGE_HOURS),
        archivedAt: timestamptz("archived_at"),
        createdAt: createdAt(),
    },
    (t) => [
        unique("projects_workspace_slug_unique").on(t.workspaceId, t.slug),
        check("projects_offline_max_age_check", sql`${t.offlineMaxAgeHours} > 0`),
    ],
);

export const environments = pgTable(
    "environments",
    {
        id: id(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        changeSeq: bigint("change_seq", { mode: "number" }).notNull().default(0),
        createdAt: createdAt(),
    },
    (t) => [unique("environments_project_slug_unique").on(t.projectId, t.slug)],
);

export const environmentAccess = pgTable(
    "environment_access",
    {
        id: id(),
        environmentId: uuid("environment_id")
            .notNull()
            .references(() => environments.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        access: text("access").$type<AccessOverride>().notNull(),
        createdAt: createdAt(),
    },
    (t) => [
        unique("environment_access_env_user_unique").on(t.environmentId, t.userId),
        index("environment_access_user_id_idx").on(t.userId),
        check("environment_access_access_check", oneOf(t.access, ACCESS_OVERRIDES)),
    ],
);

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

export const secrets = pgTable(
    "secrets",
    {
        id: id(),
        environmentId: uuid("environment_id")
            .notNull()
            .references(() => environments.id, { onDelete: "cascade" }),
        key: text("key").notNull(),
        ...encryptedColumns(),
        version: integer("version").notNull().default(1),
        deletedAt: timestamptz("deleted_at"),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => users.id),
        updatedBy: uuid("updated_by")
            .notNull()
            .references(() => users.id),
        updatedAt: timestamptz("updated_at").notNull().defaultNow(),
        createdAt: createdAt(),
    },
    (t) => [
        unique("secrets_environment_key_unique").on(t.environmentId, t.key),
        index("secrets_created_by_idx").on(t.createdBy),
        index("secrets_updated_by_idx").on(t.updatedBy),
    ],
);

export const secretVersions = pgTable(
    "secret_versions",
    {
        id: id(),
        secretId: uuid("secret_id")
            .notNull()
            .references(() => secrets.id, { onDelete: "cascade" }),
        version: integer("version").notNull(),
        ...encryptedColumns(),
        op: text("op").$type<SecretOp>().notNull(),
        changedByType: text("changed_by_type").$type<ActorType>().notNull(),
        /** Polymorphic (user, device or service token), so no foreign key. */
        changedById: uuid("changed_by_id"),
        createdAt: createdAt(),
    },
    (t) => [
        unique("secret_versions_secret_version_unique").on(t.secretId, t.version),
        check("secret_versions_op_check", oneOf(t.op, SECRET_OPS)),
        check("secret_versions_changed_by_type_check", oneOf(t.changedByType, ACTOR_TYPES)),
    ],
);

export const changes = pgTable(
    "changes",
    {
        environmentId: uuid("environment_id")
            .notNull()
            .references(() => environments.id, { onDelete: "cascade" }),
        seq: bigint("seq", { mode: "number" }).notNull(),
        secretId: uuid("secret_id")
            .notNull()
            .references(() => secrets.id, { onDelete: "cascade" }),
        key: text("key").notNull(),
        op: text("op").$type<SecretOp>().notNull(),
        version: integer("version").notNull(),
        createdAt: createdAt(),
    },
    (t) => [
        primaryKey({ columns: [t.environmentId, t.seq] }),
        index("changes_secret_id_idx").on(t.secretId),
        index("changes_created_at_idx").on(t.createdAt),
        check("changes_op_check", oneOf(t.op, SECRET_OPS)),
    ],
);

// ---------------------------------------------------------------------------
// Tokens, audit, integrations
// ---------------------------------------------------------------------------

export const serviceTokens = pgTable(
    "service_tokens",
    {
        id: id(),
        environmentId: uuid("environment_id")
            .notNull()
            .references(() => environments.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        tokenHash: text("token_hash").notNull().unique(),
        prefix: text("prefix").notNull(),
        last4: text("last4").notNull(),
        expiresAt: timestamptz("expires_at"),
        revokedAt: timestamptz("revoked_at"),
        lastUsedAt: timestamptz("last_used_at"),
        lastUsedIp: text("last_used_ip"),
        ipAllowlist: text("ip_allowlist").array(),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => users.id),
        createdAt: createdAt(),
    },
    (t) => [
        index("service_tokens_environment_id_idx").on(t.environmentId),
        index("service_tokens_created_by_idx").on(t.createdBy),
    ],
);

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: id(),
        /** Null for events that belong to no workspace (signup, login, ...). */
        workspaceId: uuid("workspace_id").references(() => workspaces.id, {
            onDelete: "cascade",
        }),
        actorType: text("actor_type").$type<ActorType>().notNull(),
        actorId: uuid("actor_id"),
        action: text("action").notNull(),
        targetType: text("target_type"),
        targetId: text("target_id"),
        /** Must never contain secret values. */
        metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
        ip: text("ip"),
        createdAt: createdAt(),
    },
    (t) => [
        index("audit_logs_workspace_created_idx").on(t.workspaceId, t.createdAt.desc()),
        check("audit_logs_actor_type_check", oneOf(t.actorType, ACTOR_TYPES)),
    ],
);

export const integrationConnections = pgTable(
    "integration_connections",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        provider: text("provider").$type<IntegrationProvider>().notNull(),
        /** Provider credentials, envelope-encrypted like secrets. */
        ...encryptedColumns(),
        externalAccountId: text("external_account_id"),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => users.id),
        revokedAt: timestamptz("revoked_at"),
        createdAt: createdAt(),
    },
    (t) => [
        index("integration_connections_workspace_id_idx").on(t.workspaceId),
        index("integration_connections_created_by_idx").on(t.createdBy),
        check("integration_connections_provider_check", oneOf(t.provider, INTEGRATION_PROVIDERS)),
    ],
);

export const integrationMappings = pgTable(
    "integration_mappings",
    {
        id: id(),
        connectionId: uuid("connection_id")
            .notNull()
            .references(() => integrationConnections.id, { onDelete: "cascade" }),
        environmentId: uuid("environment_id")
            .notNull()
            .references(() => environments.id, { onDelete: "cascade" }),
        externalProjectId: text("external_project_id").notNull(),
        externalTeamId: text("external_team_id"),
        externalTarget: text("external_target").$type<VercelTarget>().notNull(),
        redeployAfterSync: boolean("redeploy_after_sync").notNull().default(false),
        status: text("status").$type<MappingStatus>().notNull().default("pending"),
        lastSyncedAt: timestamptz("last_synced_at"),
        lastError: text("last_error"),
        /** Keys this sync created on the provider; only these may be deleted. */
        managedKeys: text("managed_keys")
            .array()
            .notNull()
            .default(sql`'{}'::text[]`),
        createdAt: createdAt(),
    },
    (t) => [
        index("integration_mappings_connection_id_idx").on(t.connectionId),
        index("integration_mappings_environment_id_idx").on(t.environmentId),
        check("integration_mappings_target_check", oneOf(t.externalTarget, VERCEL_TARGETS)),
        check("integration_mappings_status_check", oneOf(t.status, MAPPING_STATUSES)),
    ],
);

export const syncJobs = pgTable(
    "sync_jobs",
    {
        id: id(),
        mappingId: uuid("mapping_id")
            .notNull()
            .references(() => integrationMappings.id, { onDelete: "cascade" }),
        status: text("status").$type<SyncJobStatus>().notNull().default("queued"),
        attempts: integer("attempts").notNull().default(0),
        runAfter: timestamptz("run_after").notNull().defaultNow(),
        lastError: text("last_error"),
        createdAt: createdAt(),
    },
    (t) => [
        index("sync_jobs_mapping_id_idx").on(t.mappingId),
        index("sync_jobs_status_run_after_idx").on(t.status, t.runAfter),
        check("sync_jobs_status_check", oneOf(t.status, SYNC_JOB_STATUSES)),
    ],
);

export const rateLimits = pgTable(
    "rate_limits",
    {
        key: text("key").notNull(),
        windowStart: timestamptz("window_start").notNull(),
        count: integer("count").notNull().default(0),
    },
    (t) => [primaryKey({ columns: [t.key, t.windowStart] }), index("rate_limits_window_start_idx").on(t.windowStart)],
);
