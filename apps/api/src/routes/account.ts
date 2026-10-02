import type { DeviceDto, MeResponse } from "@repo/core";
import { and, desc, devices, eq, isNull, users, workspaceMembers, workspaces } from "@repo/db";
import { Hono } from "hono";
import type { AppEnv } from "../context.js";
import { notFound, unauthenticated } from "../errors.js";
import { isUuid } from "../http.js";
import { toUserDto } from "../lib/users.js";
import { getUserPrincipal, requireAuth } from "../middleware/authenticate.js";

export const accountRoutes = new Hono<AppEnv>();

// Guards are attached per route: a bare `.use()` in a sub-app mounted at "/"
// would apply to every route in the parent app.
const anyUser = requireAuth("user", "device");

accountRoutes.get("/me", anyUser, async (c) => {
    const principal = getUserPrincipal(c);
    const { db } = c.get("deps");

    const [user] = await db.select().from(users).where(eq(users.id, principal.userId)).limit(1);
    if (!user) throw unauthenticated();

    const memberships = await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
            role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(eq(workspaceMembers.userId, user.id))
        .orderBy(workspaces.name);

    const response: MeResponse = {
        user: toUserDto(user),
        workspaces: memberships,
    };
    return c.json(response);
});

accountRoutes.get("/devices", anyUser, async (c) => {
    const principal = getUserPrincipal(c);
    const { db } = c.get("deps");

    const rows = await db
        .select()
        .from(devices)
        .where(and(eq(devices.userId, principal.userId), isNull(devices.revokedAt)))
        .orderBy(desc(devices.createdAt));

    const response: { devices: DeviceDto[] } = {
        devices: rows.map((row) => ({
            id: row.id,
            name: row.name,
            platform: row.platform,
            lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
        })),
    };
    return c.json(response);
});

accountRoutes.delete("/devices/:id", anyUser, async (c) => {
    const principal = getUserPrincipal(c);
    const id = c.req.param("id");
    if (!isUuid(id)) throw notFound("Device not found");

    const { db } = c.get("deps");
    const [revoked] = await db
        .update(devices)
        .set({ revokedAt: new Date() })
        .where(and(eq(devices.id, id), eq(devices.userId, principal.userId), isNull(devices.revokedAt)))
        .returning({ id: devices.id });

    if (!revoked) throw notFound("Device not found");
    return c.json({ ok: true });
});
