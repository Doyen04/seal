import { z } from "zod";
import { emailSchema, emailTokenSchema } from "./common.js";

/** Lowercase letters, digits and hyphens, 2 to 40 characters. */
export const slugSchema = z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits and hyphens only");

const nameSchema = z.string().trim().min(1).max(100);

/** Roles that can be handed out through invitations or role changes. */
export const assignableRoleSchema = z.enum(["admin", "editor", "viewer"]);

export const createWorkspaceSchema = z.object({
    name: nameSchema,
    slug: slugSchema,
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const inviteMemberSchema = z.object({
    email: emailSchema,
    role: assignableRoleSchema,
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const acceptInvitationSchema = z.object({
    token: emailTokenSchema,
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export const updateMemberSchema = z.object({
    role: assignableRoleSchema,
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const createProjectSchema = z.object({
    name: nameSchema,
    slug: slugSchema,
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
    .object({
        name: nameSchema.optional(),
        offlineMaxAgeHours: z.number().int().min(1).max(8760).optional(),
    })
    .refine((v) => v.name !== undefined || v.offlineMaxAgeHours !== undefined, {
        message: "Provide at least one field to update",
    });
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createEnvironmentSchema = z.object({
    name: nameSchema,
    slug: slugSchema,
});
export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;

export const auditQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().max(200).optional(),
    action: z.string().min(1).max(100).optional(),
    actor: z.uuid().optional(),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

// Response shapes shared by the API and its clients.

export type RoleName = "owner" | "admin" | "editor" | "viewer";

export interface WorkspaceDto {
    id: string;
    name: string;
    slug: string;
    role: RoleName;
}

export interface MemberDto {
    userId: string;
    email: string;
    name: string;
    role: RoleName;
    joinedAt: string;
}

export interface InvitationDto {
    id: string;
    email: string;
    role: RoleName;
    expiresAt: string;
}

export interface EnvironmentDto {
    id: string;
    name: string;
    slug: string;
}

export interface ProjectDto {
    id: string;
    workspaceId: string;
    name: string;
    slug: string;
    offlineMaxAgeHours: number;
    createdAt: string;
}

export interface ProjectDetailDto extends ProjectDto {
    environments: EnvironmentDto[];
}

/** One entry per environment the removed member could read secrets from. */
export interface RotationChecklistEntry {
    projectId: string;
    projectName: string;
    environmentId: string;
    environmentName: string;
    keys: string[];
}

export interface RemoveMemberResponse {
    ok: true;
    rotationChecklist: RotationChecklistEntry[];
}

export interface AuditEntryDto {
    id: string;
    actorType: "user" | "device" | "service_token" | "system";
    actorId: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, unknown>;
    ip: string | null;
    createdAt: string;
}

export interface AuditPageDto {
    entries: AuditEntryDto[];
    nextCursor: string | null;
}
