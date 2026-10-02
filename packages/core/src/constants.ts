// Keep this file dependency-free: the database schema imports it directly.

export const ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ACCESS_OVERRIDES = ["none", "read", "write"] as const;
export type AccessOverride = (typeof ACCESS_OVERRIDES)[number];

export const EMAIL_TOKEN_TYPES = ["verify", "reset"] as const;
export type EmailTokenType = (typeof EMAIL_TOKEN_TYPES)[number];

export const SECRET_OPS = ["create", "update", "delete"] as const;
export type SecretOp = (typeof SECRET_OPS)[number];

export const ACTOR_TYPES = ["user", "device", "service_token", "system"] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const INTEGRATION_PROVIDERS = ["vercel"] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const VERCEL_TARGETS = ["production", "preview", "development"] as const;
export type VercelTarget = (typeof VERCEL_TARGETS)[number];

export const MAPPING_STATUSES = ["ok", "failed", "pending", "broken"] as const;
export type MappingStatus = (typeof MAPPING_STATUSES)[number];

export const SYNC_JOB_STATUSES = ["queued", "running", "done", "failed"] as const;
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number];

export const DEFAULT_ENVIRONMENTS = [
    { name: "Development", slug: "development" },
    { name: "Staging", slug: "staging" },
    { name: "Production", slug: "production" },
] as const;

export const DEFAULT_OFFLINE_MAX_AGE_HOURS = 72;
