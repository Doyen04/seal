import { z } from "zod";

export const createServiceTokenSchema = z.object({
    name: z.string().trim().min(1).max(100),
    /** Exact timestamps only. Ranges are not accepted; expiry is enforced on use. */
    expiresAt: z.iso.datetime().optional(),
    /** Exact IP addresses, matched as strings. CIDR ranges are not supported. */
    ipAllowlist: z
        .array(z.union([z.ipv4(), z.ipv6()]))
        .max(50)
        .optional(),
});
export type CreateServiceTokenInput = z.infer<typeof createServiceTokenSchema>;

export interface ServiceTokenDto {
    id: string;
    name: string;
    prefix: string;
    last4: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
    lastUsedIp: string | null;
    ipAllowlist: string[] | null;
    createdAt: string;
}

export interface CreateServiceTokenResponse {
    id: string;
    name: string;
    token: string;
    prefix: string;
    last4: string;
}
