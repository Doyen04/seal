import { z } from "zod";

export const createServiceTokenSchema = z.object({
    name: z.string().trim().min(1).max(100),
    expiresAt: z.string().optional(),
    ipAllowlist: z.array(z.string().trim().min(1).max(100)).optional(),
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
