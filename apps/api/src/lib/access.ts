import type { AccessOverride, Role } from "@repo/core";
import {
  and,
  environmentAccess,
  environments,
  eq,
  projects,
  workspaceMembers,
  type Executor,
} from "@repo/db";
import type { Context } from "hono";
import type { AppEnv, Principal } from "../context.js";
import { forbidden, notFound, unauthenticated } from "../errors.js";
import { isUuid } from "../http.js";

export type AccessLevel = "none" | "read" | "write" | "admin";

const ACCESS_RANK: Record<AccessLevel, number> = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3,
};

const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function accessAtLeast(level: AccessLevel, min: AccessLevel): boolean {
  return ACCESS_RANK[level] >= ACCESS_RANK[min];
}

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/**
 * Pure access decision for a workspace member on one environment.
 *
 * - Not a member: none.
 * - Admins and owners always have admin access; overrides never apply to them.
 * - override "none" hides the environment; "read" caps at read;
 *   "write" raises a viewer to write (an editor already has it).
 */
export function computeAccess(
  role: Role | null,
  override: AccessOverride | null,
): AccessLevel {
  if (role === null) return "none";
  if (role === "owner" || role === "admin") return "admin";

  if (override === "none") return "none";
  if (override === "read") return "read";
  if (override === "write") return "write";

  return role === "editor" ? "write" : "read";
}

/** What a service token may do: read its own environment, nothing else. */
export function computeServiceTokenAccess(
  tokenEnvironmentId: string,
  environmentId: string,
): AccessLevel {
  return tokenEnvironmentId === environmentId ? "read" : "none";
}

/** The member's role in a workspace, or null if they are not a member. */
export async function getMemberRole(
  db: Executor,
  userId: string,
  workspaceId: string,
): Promise<Role | null> {
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1);
  return row?.role ?? null;
}

/**
 * The single entry point for "what can this principal do in this environment".
 * Unknown ids, archived projects and other tenants' environments all come back
 * as "none", so callers cannot tell them apart.
 */
export async function resolveAccess(
  db: Executor,
  principal: Principal,
  environmentId: string,
): Promise<AccessLevel> {
  if (!isUuid(environmentId)) return "none";

  const [env] = await db
    .select({
      workspaceId: projects.workspaceId,
      archivedAt: projects.archivedAt,
    })
    .from(environments)
    .innerJoin(projects, eq(projects.id, environments.projectId))
    .where(eq(environments.id, environmentId))
    .limit(1);

  if (!env || env.archivedAt) return "none";

  if (principal.type === "service_token") {
    return computeServiceTokenAccess(principal.environmentId, environmentId);
  }

  const role = await getMemberRole(db, principal.userId, env.workspaceId);
  if (role === null) return "none";

  const [override] = await db
    .select({ access: environmentAccess.access })
    .from(environmentAccess)
    .where(
      and(
        eq(environmentAccess.environmentId, environmentId),
        eq(environmentAccess.userId, principal.userId),
      ),
    )
    .limit(1);

  return computeAccess(role, override?.access ?? null);
}

/**
 * Workspace-level guard for user/device principals. A non-member gets
 * NOT_FOUND (the workspace's existence is not revealed); a member with too
 * low a role gets FORBIDDEN.
 */
export async function requireWorkspaceRole(
  c: Context<AppEnv>,
  workspaceId: string,
  min: Role,
): Promise<{ userId: string; role: Role }> {
  const principal = c.get("principal");
  if (!principal) throw unauthenticated();
  if (principal.type === "service_token") throw forbidden();
  if (!isUuid(workspaceId)) throw notFound("Workspace not found");

  const role = await getMemberRole(
    c.get("deps").db,
    principal.userId,
    workspaceId,
  );
  if (role === null) throw notFound("Workspace not found");
  if (!roleAtLeast(role, min)) throw forbidden();

  return { userId: principal.userId, role };
}
