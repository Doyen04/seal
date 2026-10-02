import { z } from "zod";

export const SECRET_KEY_REGEX = /^[A-Z_][A-Z0-9_]*$/;
export const SECRET_KEY_MAX_LENGTH = 255;
export const SECRET_VALUE_MAX_BYTES = 64 * 1024;
export const BULK_MAX_ITEMS = 500;

export const secretKeySchema = z
    .string()
    .min(1)
    .max(SECRET_KEY_MAX_LENGTH)
    .regex(SECRET_KEY_REGEX, "Use uppercase letters, digits and underscores, not starting with a digit");

/** Any UTF-8 string up to 64 KB (measured in bytes, not characters). */
export const secretValueSchema = z
    .string()
    .refine((v) => new TextEncoder().encode(v).length <= SECRET_VALUE_MAX_BYTES, {
        message: "Value must be at most 64 KB",
    });

/** The version the client last saw. 0 means "I believe this key does not exist". */
export const baseVersionSchema = z.number().int().min(0);

export const putSecretSchema = z.object({
    value: secretValueSchema,
    baseVersion: baseVersionSchema.optional(),
});
export type PutSecretInput = z.infer<typeof putSecretSchema>;

export const deleteSecretSchema = z.object({
    baseVersion: baseVersionSchema.optional(),
});
export type DeleteSecretInput = z.infer<typeof deleteSecretSchema>;

export const bulkSecretsSchema = z
    .object({
        items: z
            .array(
                z.object({
                    key: secretKeySchema,
                    value: secretValueSchema,
                    baseVersion: baseVersionSchema.optional(),
                }),
            )
            .min(1)
            .max(BULK_MAX_ITEMS),
    })
    .refine((v) => new Set(v.items.map((i) => i.key)).size === v.items.length, {
        message: "Each key may appear only once",
        path: ["items"],
    });
export type BulkSecretsInput = z.infer<typeof bulkSecretsSchema>;

export const rollbackSecretSchema = z.object({
    version: z.number().int().min(1),
});
export type RollbackSecretInput = z.infer<typeof rollbackSecretSchema>;

// Response shapes shared by the API and its clients.

export type SecretOpName = "create" | "update" | "delete";

export interface SecretMetaDto {
    id: string;
    key: string;
    version: number;
    updatedAt: string;
    updatedBy: { id: string; name: string } | null;
}

export interface SecretValueDto {
    key: string;
    value: string;
    version: number;
}

export interface SecretWriteResultDto {
    key: string;
    version: number;
    op: SecretOpName;
    seq: number;
}

export interface BulkWriteResponse {
    applied: SecretWriteResultDto[];
    latestSeq: number;
}

export interface ExportResponse {
    secrets: Record<string, string>;
    seq: number;
    offlineMaxAgeHours: number;
}

export interface SecretVersionDto {
    version: number;
    op: SecretOpName;
    changedByType: "user" | "device" | "service_token" | "system";
    changedById: string | null;
    createdAt: string;
}
