import {
    DEFAULT_ENVIRONMENTS,
    createEnvironmentSchema,
    createProjectSchema,
    updateProjectSchema,
    type EnvironmentDto,
    type ProjectDetailDto,
    type ProjectDto,
    type Role,
} from "@repo/core";
import { and, asc, environmentAccess, environments, eq, isNull, projects, type Executor } from "@repo/db";
import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../context.js";
import { notFound, validationError } from "../errors.js";
import { isUuid, parseJson } from "../http.js";
import { accessAtLeast, computeAccess, requireWorkspaceRole } from "../lib/access.js";
import { writeAudit } from "../lib/audit.js";
import { requireAuth } from "../middleware/authenticate.js";

const anyUser = requireAuth("user", "device");

type ProjectRow = typeof projects.$inferSelect;

function toProjectDto(row: ProjectRow): ProjectDto {
    return {
        id: row.id,
        workspaceId: row.workspaceId,
        name: row.name,
        slug: row.slug,
        offlineMaxAgeHours: row.offlineMaxAgeHours,
        createdAt: row.createdAt.toISOString(),
    };
}

/**
 * Loads a live (non-archived) project and checks the caller's workspace role.
 * Unknown ids and other tenants' projects produce the same NOT_FOUND.
 */
async function loadProjectWithRole(
    c: Context<AppEnv>,
    projectId: string,
    min: "viewer" | "admin",
): Promise<{ project: ProjectRow; userId: string; role: Role }> {
    const message = "Project not found";
    if (!isUuid(projectId)) throw notFound(message);

    const [project] = await c
        .get("deps")
        .db.select()
        .from(projects)
        .where(and(eq(projects.id, projectId), isNull(projects.archivedAt)))
        .limit(1);
    if (!project) throw notFound(message);

    const { userId, role } = await requireWorkspaceRole(c, project.workspaceId, min, message);
    return { project, userId, role };
}

async function insertEnvironment(db: Executor, projectId: string, name: string, slug: string): Promise<EnvironmentDto> {
    const [created] = await db
        .insert(environments)
        .values({ projectId, name, slug })
        .onConflictDoNothing({ target: [environments.projectId, environments.slug] })
        .returning();
    if (!created) {
        throw validationError("That slug is already taken", {
            issues: [{ path: "slug", message: "That slug is already taken" }],
        });
    }
    return { id: created.id, name: created.name, slug: created.slug };
}

export const projectRoutes = new Hono<AppEnv>();

projectRoutes.post("/workspaces/:wid/projects", anyUser, async (c) => {
    const wid = c.req.param("wid");
    await requireWorkspaceRole(c, wid, "admin");
    const body = await parseJson(c, createProjectSchema);
    const { db } = c.get("deps");

    const result = await db.transaction(async (tx) => {
        const [project] = await tx
            .insert(projects)
            .values({ workspaceId: wid, name: body.name, slug: body.slug })
            .onConflictDoNothing({ target: [projects.workspaceId, projects.slug] })
            .returning();
        if (!project) {
            throw validationError("That slug is already taken", {
                issues: [{ path: "slug", message: "That slug is already taken" }],
            });
        }

        const created: EnvironmentDto[] = [];
        for (const env of DEFAULT_ENVIRONMENTS) {
            created.push(await insertEnvironment(tx, project.id, env.name, env.slug));
        }

        await writeAudit(tx, c, {
            workspaceId: wid,
            action: "project.create",
            targetType: "project",
            targetId: project.id,
            metadata: { slug: project.slug },
        });
        return { project, environments: created };
    });

    const response: ProjectDetailDto = {
        ...toProjectDto(result.project),
        environments: result.environments,
    };
    return c.json(response, 201);
});

projectRoutes.get("/workspaces/:wid/projects", anyUser, async (c) => {
    const wid = c.req.param("wid");
    await requireWorkspaceRole(c, wid, "viewer");
    const { db } = c.get("deps");

    const rows = await db
        .select()
        .from(projects)
        .where(and(eq(projects.workspaceId, wid), isNull(projects.archivedAt)))
        .orderBy(asc(projects.name));

    const response: { projects: ProjectDto[] } = {
        projects: rows.map(toProjectDto),
    };
    return c.json(response);
});

projectRoutes.get("/projects/:pid", anyUser, async (c) => {
    const { project, userId, role } = await loadProjectWithRole(c, c.req.param("pid"), "viewer");
    const { db } = c.get("deps");

    const rows = await db
        .select({
            id: environments.id,
            name: environments.name,
            slug: environments.slug,
            override: environmentAccess.access,
        })
        .from(environments)
        .leftJoin(
            environmentAccess,
            and(eq(environmentAccess.environmentId, environments.id), eq(environmentAccess.userId, userId)),
        )
        .where(eq(environments.projectId, project.id))
        .orderBy(asc(environments.createdAt));

    // Environments hidden from this member by an override are left out entirely.
    const visible = rows
        .filter((row) => accessAtLeast(computeAccess(role, row.override), "read"))
        .map(({ id, name, slug }) => ({ id, name, slug }));

    const response: ProjectDetailDto = {
        ...toProjectDto(project),
        environments: visible,
    };
    return c.json(response);
});

projectRoutes.patch("/projects/:pid", anyUser, async (c) => {
    const { project } = await loadProjectWithRole(c, c.req.param("pid"), "admin");
    const body = await parseJson(c, updateProjectSchema);
    const { db } = c.get("deps");

    const updated = await db.transaction(async (tx) => {
        const [row] = await tx
            .update(projects)
            .set({
                ...(body.name !== undefined ? { name: body.name } : {}),
                ...(body.offlineMaxAgeHours !== undefined ? { offlineMaxAgeHours: body.offlineMaxAgeHours } : {}),
            })
            .where(eq(projects.id, project.id))
            .returning();
        if (!row) throw notFound("Project not found");
        await writeAudit(tx, c, {
            workspaceId: project.workspaceId,
            action: "project.update",
            targetType: "project",
            targetId: project.id,
            metadata: {
                ...(body.name !== undefined ? { name: body.name } : {}),
                ...(body.offlineMaxAgeHours !== undefined ? { offlineMaxAgeHours: body.offlineMaxAgeHours } : {}),
            },
        });
        return row;
    });

    return c.json({ project: toProjectDto(updated) });
});

projectRoutes.delete("/projects/:pid", anyUser, async (c) => {
    const { project } = await loadProjectWithRole(c, c.req.param("pid"), "admin");
    const { db } = c.get("deps");

    await db.transaction(async (tx) => {
        await tx.update(projects).set({ archivedAt: new Date() }).where(eq(projects.id, project.id));
        await writeAudit(tx, c, {
            workspaceId: project.workspaceId,
            action: "project.archive",
            targetType: "project",
            targetId: project.id,
        });
    });

    return c.json({ ok: true });
});

projectRoutes.post("/projects/:pid/environments", anyUser, async (c) => {
    const { project } = await loadProjectWithRole(c, c.req.param("pid"), "admin");
    const body = await parseJson(c, createEnvironmentSchema);
    const { db } = c.get("deps");

    const environment = await db.transaction(async (tx) => {
        const created = await insertEnvironment(tx, project.id, body.name, body.slug);
        await writeAudit(tx, c, {
            workspaceId: project.workspaceId,
            action: "environment.create",
            targetType: "environment",
            targetId: created.id,
            metadata: { slug: created.slug },
        });
        return created;
    });

    return c.json({ environment }, 201);
});
