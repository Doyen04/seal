import {
    acceptInvitationSchema,
    auditQuerySchema,
    createWorkspaceSchema,
    inviteMemberSchema,
    updateMemberSchema,
    updateMemberAccessSchema,
    type AccessOverride,
    type AuditPageDto,
    type InvitationDto,
    type MemberAccessDto,
    type MemberDto,
    type RemoveMemberResponse,
    type RotationChecklistEntry,
    type WorkspaceDto,
} from "@repo/core";
import { generateToken, hashToken } from "@repo/crypto";
import {
    and,
    auditLogs,
    desc,
    environmentAccess,
    environments,
    eq,
    inArray,
    invitations,
    isNull,
    projects,
    secrets,
    sql,
    users,
    workspaceMembers,
    workspaces,
    type Executor,
} from "@repo/db";
import { Hono } from "hono";
import type { AppEnv } from "../context.js";
import { invitationMessage } from "../email/templates.js";
import { forbidden, notFound, unauthenticated, validationError } from "../errors.js";
import { isUuid, parseJson, parseQuery } from "../http.js";
import { accessAtLeast, computeAccess, getMemberRole, requireWorkspaceRole } from "../lib/access.js";
import { writeAudit } from "../lib/audit.js";
import { getUserPrincipal, requireAuth } from "../middleware/authenticate.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const anyUser = requireAuth("user", "device");

/**
 * Rejects any environment that is not a project in this workspace.
 *
 * Without this an admin of workspace A could name an environment belonging to
 * workspace B and have a grant written against it. Returns the accepted rows so
 * callers can report project and environment names back to the client.
 */
async function resolveWorkspaceEnvironments(
    db: Executor,
    workspaceId: string,
    requested: { environmentId: string; access: AccessOverride }[],
): Promise<Map<string, { projectId: string; projectName: string; environmentName: string }>> {
    const uniqueIds = [...new Set(requested.map((r) => r.environmentId))];
    const found = new Map<string, { projectId: string; projectName: string; environmentName: string }>();
    if (uniqueIds.length === 0) return found;

    const rows = await db
        .select({
            environmentId: environments.id,
            environmentName: environments.name,
            projectId: projects.id,
            projectName: projects.name,
        })
        .from(environments)
        .innerJoin(projects, eq(projects.id, environments.projectId))
        .where(and(eq(projects.workspaceId, workspaceId), inArray(environments.id, uniqueIds)));

    for (const row of rows) {
        found.set(row.environmentId, {
            projectId: row.projectId,
            projectName: row.projectName,
            environmentName: row.environmentName,
        });
    }

    const unknown = uniqueIds.filter((id) => !found.has(id));
    if (unknown.length > 0) {
        throw validationError("One or more environments do not belong to this workspace");
    }
    return found;
}

/** Flattens validated overrides into the DTO shape the clients render. */
function toAccessDtos(
    requested: { environmentId: string; access: AccessOverride }[],
    resolved: Map<string, { projectId: string; projectName: string; environmentName: string }>,
): MemberAccessDto[] {
    return requested.map((entry) => {
        const meta = resolved.get(entry.environmentId)!;
        return {
            projectId: meta.projectId,
            projectName: meta.projectName,
            environmentId: entry.environmentId,
            environmentName: meta.environmentName,
            access: entry.access,
        };
    });
}

export const workspaceRoutes = new Hono<AppEnv>();

workspaceRoutes.post("/workspaces", anyUser, async (c) => {
    const principal = getUserPrincipal(c);
    const body = await parseJson(c, createWorkspaceSchema);
    const { db } = c.get("deps");

    const workspace = await db.transaction(async (tx) => {
        const [created] = await tx
            .insert(workspaces)
            .values({ name: body.name, slug: body.slug, createdBy: principal.userId })
            .onConflictDoNothing({ target: workspaces.slug })
            .returning();
        if (!created) {
            throw validationError("That slug is already taken", {
                issues: [{ path: "slug", message: "That slug is already taken" }],
            });
        }
        await tx.insert(workspaceMembers).values({
            workspaceId: created.id,
            userId: principal.userId,
            role: "owner",
        });
        await writeAudit(tx, c, {
            workspaceId: created.id,
            action: "workspace.create",
            targetType: "workspace",
            targetId: created.id,
            metadata: { slug: created.slug },
        });
        return created;
    });

    const response: WorkspaceDto = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: "owner",
    };
    return c.json(response, 201);
});

workspaceRoutes.get("/workspaces", anyUser, async (c) => {
    const principal = getUserPrincipal(c);
    const { db } = c.get("deps");

    const rows = await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
            role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(eq(workspaceMembers.userId, principal.userId))
        .orderBy(workspaces.name);

    const response: { workspaces: WorkspaceDto[] } = { workspaces: rows };
    return c.json(response);
});

workspaceRoutes.get("/workspaces/:wid/members", anyUser, async (c) => {
    const wid = c.req.param("wid");
    await requireWorkspaceRole(c, wid, "viewer");
    const { db } = c.get("deps");

    const rows = await db
        .select({
            userId: users.id,
            email: users.email,
            name: users.name,
            role: workspaceMembers.role,
            joinedAt: workspaceMembers.createdAt,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(eq(workspaceMembers.workspaceId, wid))
        .orderBy(workspaceMembers.createdAt);

    // Existing per-environment overrides, so the client can render an edit form
    // without a second request.
    const overrides = await db
        .select({
            userId: environmentAccess.userId,
            environmentId: environmentAccess.environmentId,
            access: environmentAccess.access,
            environmentName: environments.name,
            projectId: projects.id,
            projectName: projects.name,
        })
        .from(environmentAccess)
        .innerJoin(environments, eq(environments.id, environmentAccess.environmentId))
        .innerJoin(projects, eq(projects.id, environments.projectId))
        .where(eq(projects.workspaceId, wid));

    const byUser = new Map<string, MemberAccessDto[]>();
    for (const row of overrides) {
        const list = byUser.get(row.userId) ?? [];
        list.push({
            projectId: row.projectId,
            projectName: row.projectName,
            environmentId: row.environmentId,
            environmentName: row.environmentName,
            access: row.access,
        });
        byUser.set(row.userId, list);
    }

    const members: MemberDto[] = rows.map((row) => ({
        ...row,
        joinedAt: row.joinedAt.toISOString(),
        access: byUser.get(row.userId) ?? [],
    }));
    return c.json({ members });
});

/** Replaces a member's per-environment access wholesale. */
workspaceRoutes.put("/workspaces/:wid/members/:uid/access", anyUser, async (c) => {
    const wid = c.req.param("wid");
    const uid = c.req.param("uid");
    await requireWorkspaceRole(c, wid, "admin");
    const body = await parseJson(c, updateMemberAccessSchema);
    const { db } = c.get("deps");

    const [member] = await db
        .select({ userId: workspaceMembers.userId, role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, wid), eq(workspaceMembers.userId, uid)))
        .limit(1);
    if (!member) throw notFound("Member not found");

    // Overrides are meaningless for owners and admins, whose access is always
    // admin, so reject rather than silently storing rows that never apply.
    if (member.role === "owner" || member.role === "admin") {
        throw validationError("Owners and admins already have full access to every environment");
    }

    const resolvedEnvs = await resolveWorkspaceEnvironments(db, wid, body.access);

    await db.transaction(async (tx) => {
        // Wholesale replace: clear every override this member holds in this
        // workspace, not just the ones named in the request. Scoping the delete
        // to the incoming list would silently keep overrides the caller removed.
        const workspaceEnvIds = tx
            .select({ id: environments.id })
            .from(environments)
            .innerJoin(projects, eq(projects.id, environments.projectId))
            .where(eq(projects.workspaceId, wid));

        await tx
            .delete(environmentAccess)
            .where(and(eq(environmentAccess.userId, uid), inArray(environmentAccess.environmentId, workspaceEnvIds)));

        if (body.access.length > 0) {
            await tx
                .insert(environmentAccess)
                .values(
                    body.access.map((entry) => ({
                        environmentId: entry.environmentId,
                        userId: uid,
                        access: entry.access,
                    })),
                )
                .onConflictDoUpdate({
                    target: [environmentAccess.environmentId, environmentAccess.userId],
                    set: { access: sql`excluded."access"` },
                });
        }

        await writeAudit(tx, c, {
            workspaceId: wid,
            action: "member.access_change",
            targetType: "user",
            targetId: uid,
            metadata: { environmentAccess: toAccessDtos(body.access, resolvedEnvs) },
        });
    });

    const response: { access: MemberAccessDto[] } = {
        access: toAccessDtos(body.access, resolvedEnvs),
    };
    return c.json(response);
});

workspaceRoutes.post("/workspaces/:wid/invitations", anyUser, async (c) => {
    const wid = c.req.param("wid");
    await requireWorkspaceRole(c, wid, "admin");
    const body = await parseJson(c, inviteMemberSchema);
    const { db, env, email } = c.get("deps");

    const [alreadyMember] = await db
        .select({ userId: users.id })
        .from(workspaceMembers)
        .innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(and(eq(workspaceMembers.workspaceId, wid), eq(users.email, body.email)))
        .limit(1);
    if (alreadyMember) {
        throw validationError("This person is already a member");
    }

    const [workspace] = await db
        .select({ name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, wid))
        .limit(1);
    if (!workspace) throw notFound("Workspace not found");

    const principal = getUserPrincipal(c);
    const { token, hash } = generateToken("email");

    // Reject foreign or archived environments before anything is written.
    const resolvedEnvs = await resolveWorkspaceEnvironments(db, wid, body.access);

    const invitation = await db.transaction(async (tx) => {
        const [created] = await tx
            .insert(invitations)
            .values({
                workspaceId: wid,
                email: body.email,
                role: body.role,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
                accessOverrides: body.access,
                invitedBy: principal.userId,
            })
            .returning();
        if (!created) throw new Error("Invitation insert returned no row");
        await writeAudit(tx, c, {
            workspaceId: wid,
            action: "member.invite",
            targetType: "invitation",
            targetId: created.id,
            metadata: {
                email: body.email,
                role: body.role,
                environmentAccess: toAccessDtos(body.access, resolvedEnvs),
            },
        });
        return created;
    });

    await email.send(invitationMessage(body.email, env.WEB_ORIGIN, token, workspace.name, body.role));

    const response: InvitationDto = {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
        access: toAccessDtos(body.access, resolvedEnvs),
    };
    return c.json(response, 201);
});

workspaceRoutes.post("/invitations/accept", anyUser, async (c) => {
    const principal = getUserPrincipal(c);
    const body = await parseJson(c, acceptInvitationSchema);
    const { db } = c.get("deps");

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, principal.userId)).limit(1);
    if (!user) throw unauthenticated();

    const workspace = await db.transaction(async (tx) => {
        // Claiming the invitation and joining happen together; throwing below
        // rolls the claim back so the link stays usable by the right person.
        const [invitation] = await tx
            .update(invitations)
            .set({ acceptedAt: new Date() })
            .where(
                and(
                    eq(invitations.tokenHash, hashToken(body.token)),
                    isNull(invitations.acceptedAt),
                    sql`${invitations.expiresAt} > now()`,
                ),
            )
            .returning();
        if (!invitation) throw notFound("Invitation not found or expired");

        if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
            throw forbidden("This invitation was sent to a different email address");
        }

        await tx
            .insert(workspaceMembers)
            .values({
                workspaceId: invitation.workspaceId,
                userId: principal.userId,
                role: invitation.role,
            })
            .onConflictDoNothing();

        // Turn the permissions chosen at invite time into real grants. Skipped
        // for owners and admins, whose access is fixed at "admin" and which
        // never consult environment_access.
        const overrides = invitation.accessOverrides ?? [];
        if (overrides.length > 0 && invitation.role !== "owner" && invitation.role !== "admin") {
            await tx
                .insert(environmentAccess)
                .values(
                    overrides.map((entry) => ({
                        environmentId: entry.environmentId,
                        userId: principal.userId,
                        access: entry.access,
                    })),
                )
                .onConflictDoUpdate({
                    target: [environmentAccess.environmentId, environmentAccess.userId],
                    set: { access: sql`excluded."access"` },
                });
        }

        await writeAudit(tx, c, {
            workspaceId: invitation.workspaceId,
            action: "member.accept",
            targetType: "invitation",
            targetId: invitation.id,
            metadata: overrides.length > 0 ? { environmentAccess: overrides } : undefined,
        });

        const [joined] = await tx
            .select({
                id: workspaces.id,
                name: workspaces.name,
                slug: workspaces.slug,
                role: workspaceMembers.role,
            })
            .from(workspaceMembers)
            .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
            .where(
                and(
                    eq(workspaceMembers.workspaceId, invitation.workspaceId),
                    eq(workspaceMembers.userId, principal.userId),
                ),
            )
            .limit(1);
        if (!joined) throw new Error("Membership missing after accept");
        return joined;
    });

    const response: { workspace: WorkspaceDto } = { workspace };
    return c.json(response);
});

workspaceRoutes.patch("/workspaces/:wid/members/:uid", anyUser, async (c) => {
    const wid = c.req.param("wid");
    const uid = c.req.param("uid");
    await requireWorkspaceRole(c, wid, "admin");
    const body = await parseJson(c, updateMemberSchema);
    const { db } = c.get("deps");

    if (!isUuid(uid)) throw notFound("Member not found");
    const currentRole = await getMemberRole(db, uid, wid);
    if (currentRole === null) throw notFound("Member not found");
    if (currentRole === "owner") {
        throw forbidden("The owner's role cannot be changed");
    }

    const member = await db.transaction(async (tx) => {
        await tx
            .update(workspaceMembers)
            .set({ role: body.role })
            .where(and(eq(workspaceMembers.workspaceId, wid), eq(workspaceMembers.userId, uid)));
        await writeAudit(tx, c, {
            workspaceId: wid,
            action: "member.role_change",
            targetType: "user",
            targetId: uid,
            metadata: { from: currentRole, to: body.role },
        });
        const [row] = await tx
            .select({
                userId: users.id,
                email: users.email,
                name: users.name,
                role: workspaceMembers.role,
                joinedAt: workspaceMembers.createdAt,
            })
            .from(workspaceMembers)
            .innerJoin(users, eq(users.id, workspaceMembers.userId))
            .where(and(eq(workspaceMembers.workspaceId, wid), eq(workspaceMembers.userId, uid)))
            .limit(1);
        if (!row) throw new Error("Member missing after update");
        return row;
    });

    // Role changes do not touch environment_access, so carry the member's existing
    // overrides back rather than reporting an empty list.
    const memberOverrides = await db
        .select({
            environmentId: environmentAccess.environmentId,
            access: environmentAccess.access,
            environmentName: environments.name,
            projectId: projects.id,
            projectName: projects.name,
        })
        .from(environmentAccess)
        .innerJoin(environments, eq(environments.id, environmentAccess.environmentId))
        .innerJoin(projects, eq(projects.id, environments.projectId))
        .where(and(eq(environmentAccess.userId, uid), eq(projects.workspaceId, wid)));

    const response: { member: MemberDto } = {
        member: {
            ...member,
            joinedAt: member.joinedAt.toISOString(),
            access: memberOverrides.map((row) => ({
                projectId: row.projectId,
                projectName: row.projectName,
                environmentId: row.environmentId,
                environmentName: row.environmentName,
                access: row.access,
            })),
        },
    };
    return c.json(response);
});

workspaceRoutes.delete("/workspaces/:wid/members/:uid", anyUser, async (c) => {
    const wid = c.req.param("wid");
    const uid = c.req.param("uid");
    await requireWorkspaceRole(c, wid, "admin");
    const { db } = c.get("deps");

    if (!isUuid(uid)) throw notFound("Member not found");
    const role = await getMemberRole(db, uid, wid);
    if (role === null) throw notFound("Member not found");
    if (role === "owner") throw forbidden("The owner cannot be removed");

    // Work out what the member could read *before* removing their access.
    const envRows = await db
        .select({
            environmentId: environments.id,
            environmentName: environments.name,
            projectId: projects.id,
            projectName: projects.name,
            override: environmentAccess.access,
        })
        .from(environments)
        .innerJoin(projects, eq(projects.id, environments.projectId))
        .leftJoin(
            environmentAccess,
            and(eq(environmentAccess.environmentId, environments.id), eq(environmentAccess.userId, uid)),
        )
        .where(eq(projects.workspaceId, wid));

    const readable = envRows.filter((row) => accessAtLeast(computeAccess(role, row.override), "read"));

    const secretRows =
        readable.length === 0
            ? []
            : await db
                  .select({ environmentId: secrets.environmentId, key: secrets.key })
                  .from(secrets)
                  .where(
                      and(
                          inArray(
                              secrets.environmentId,
                              readable.map((row) => row.environmentId),
                          ),
                          isNull(secrets.deletedAt),
                      ),
                  )
                  .orderBy(secrets.key);

    const rotationChecklist: RotationChecklistEntry[] = [];
    for (const row of readable) {
        const keys = secretRows.filter((s) => s.environmentId === row.environmentId).map((s) => s.key);
        if (keys.length > 0) {
            rotationChecklist.push({
                projectId: row.projectId,
                projectName: row.projectName,
                environmentId: row.environmentId,
                environmentName: row.environmentName,
                keys,
            });
        }
    }

    await db.transaction(async (tx) => {
        await tx
            .delete(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, wid), eq(workspaceMembers.userId, uid)));
        if (envRows.length > 0) {
            await tx.delete(environmentAccess).where(
                and(
                    eq(environmentAccess.userId, uid),
                    inArray(
                        environmentAccess.environmentId,
                        envRows.map((row) => row.environmentId),
                    ),
                ),
            );
        }
        await writeAudit(tx, c, {
            workspaceId: wid,
            action: "member.remove",
            targetType: "user",
            targetId: uid,
            metadata: { role },
        });
    });

    const response: RemoveMemberResponse = { ok: true, rotationChecklist };
    return c.json(response);
});

interface AuditCursor {
    t: string;
    id: string;
}

function encodeCursor(cursor: AuditCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(raw: string): AuditCursor {
    try {
        const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            "t" in parsed &&
            "id" in parsed &&
            typeof parsed.t === "string" &&
            typeof parsed.id === "string" &&
            !Number.isNaN(Date.parse(parsed.t)) &&
            isUuid(parsed.id)
        ) {
            return { t: parsed.t, id: parsed.id };
        }
    } catch {
        // fall through
    }
    throw validationError("Invalid cursor");
}

workspaceRoutes.get("/workspaces/:wid/audit", anyUser, async (c) => {
    const wid = c.req.param("wid");
    await requireWorkspaceRole(c, wid, "admin");
    const query = parseQuery(c, auditQuerySchema);
    const { db } = c.get("deps");

    const conditions = [eq(auditLogs.workspaceId, wid)];
    if (query.action) conditions.push(eq(auditLogs.action, query.action));
    if (query.actor) conditions.push(eq(auditLogs.actorId, query.actor));
    if (query.actorType) conditions.push(eq(auditLogs.actorType, query.actorType));
    if (query.cursor) {
        const cursor = decodeCursor(query.cursor);
        conditions.push(
            sql`(${auditLogs.createdAt}, ${auditLogs.id}) < (${cursor.t}::timestamptz, ${cursor.id}::uuid)`,
        );
    }

    const rows = await db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
        .limit(query.limit + 1);

    const page = rows.slice(0, query.limit);
    const last = page[page.length - 1];
    const hasMore = rows.length > query.limit;

    const response: AuditPageDto = {
        entries: page.map((row) => ({
            id: row.id,
            actorType: row.actorType,
            actorId: row.actorId,
            action: row.action,
            targetType: row.targetType,
            targetId: row.targetId,
            metadata: row.metadata,
            ip: row.ip,
            createdAt: row.createdAt.toISOString(),
        })),
        nextCursor: hasMore && last ? encodeCursor({ t: last.createdAt.toISOString(), id: last.id }) : null,
    };
    return c.json(response);
});
