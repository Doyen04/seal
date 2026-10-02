import { environments, eq, projects } from "@repo/db";
import type { Context } from "hono";
import type { AppEnv } from "../context.js";
import { forbidden, notFound, unauthenticated } from "../errors.js";
import { accessAtLeast, resolveAccess, type AccessLevel } from "./access.js";

export interface EnvironmentContext {
    id: string;
    projectId: string;
    workspaceId: string;
    offlineMaxAgeHours: number;
    /** The caller's resolved access level on this environment. */
    access: AccessLevel;
}

/**
 * Checks the caller's access to an environment and loads what handlers need.
 * "No access" and "does not exist" both return NOT_FOUND, so ids in other
 * tenants cannot be probed. A caller who can see the environment but lacks
 * the required level gets FORBIDDEN.
 */
export async function authorizeEnvironment(
    c: Context<AppEnv>,
    environmentId: string,
    min: Exclude<AccessLevel, "none">,
    notFoundMessage = "Environment not found",
): Promise<EnvironmentContext> {
    const principal = c.get("principal");
    if (!principal) throw unauthenticated();
    const { db } = c.get("deps");

    const access = await resolveAccess(db, principal, environmentId);
    if (access === "none") throw notFound(notFoundMessage);
    if (!accessAtLeast(access, min)) throw forbidden();

    const [row] = await db
        .select({
            id: environments.id,
            projectId: environments.projectId,
            workspaceId: projects.workspaceId,
            offlineMaxAgeHours: projects.offlineMaxAgeHours,
        })
        .from(environments)
        .innerJoin(projects, eq(projects.id, environments.projectId))
        .where(eq(environments.id, environmentId))
        .limit(1);
    if (!row) throw notFound(notFoundMessage);

    return { ...row, access };
}
