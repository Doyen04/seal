import { z } from "zod";
import { emailSchema, emailTokenSchema } from "./common";
import { ACCESS_OVERRIDES, ACTOR_TYPES, type AccessOverride } from "../constants";

/** Lowercase letters, digits and hyphens, 2 to 40 characters. */
export const slugSchema = z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits and hyphens only");

const nameSchema = z.string().trim().min(1).max(100);

/** Roles that can be handed out through invitations or role changes. */
export const assignableRoleSchema = z.enum(["admin", "editor", "viewer"]);

/**
 * Per-environment access an admin can grant or withhold, independently of the
 * workspace role. "none" hides the environment entirely, "read" caps an editor
 * at read, and "write" raises a viewer to write.
 */
export const environmentAccessSchema = z.object({
    environmentId: z.uuid(),
    access: z.enum(ACCESS_OVERRIDES),
});
export type EnvironmentAccessInput = z.infer<typeof environmentAccessSchema>;

const environmentAccessListSchema = z.array(environmentAccessSchema).max(500);

export const createWorkspaceSchema = z.object({
    name: nameSchema,
    slug: slugSchema,
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const inviteMemberSchema = z.object({
    email: emailSchema,
    role: assignableRoleSchema,
    /** Optional per-environment grants. Omitted means "inherit the role". */
    access: environmentAccessListSchema.optional().default([]),
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

/** Replaces a member's per-environment access wholesale. */
export const updateMemberAccessSchema = z.object({
    access: environmentAccessListSchema,
});
export type UpdateMemberAccessInput = z.infer<typeof updateMemberAccessSchema>;

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
    // Previously accepted by the UI but absent here, so the non-strict object
    // silently dropped it and the filter did nothing.
    actorType: z.enum(ACTOR_TYPES).optional(),
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

/** One environment's access for one member, with enough context to render it. */
export interface MemberAccessDto {
    projectId: string;
    projectName: string;
    environmentId: string;
    environmentName: string;
    access: AccessOverride;
}

export interface MemberDto {
    userId: string;
    email: string;
    name: string;
    role: RoleName;
    joinedAt: string;
    /** Explicit per-environment overrides. Empty means the role governs everything. */
    access: MemberAccessDto[];
}

export interface InvitationDto {
    id: string;
    email: string;
    role: RoleName;
    expiresAt: string;
    /** The per-environment permissions this invitation will grant on accept. */
    access: MemberAccessDto[];
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
    /** Human label for the actor, resolved server side. Null for system events. */
    actorName: string | null;
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
