import { auditLogs, type Executor } from "@repo/db";
import type { Context } from "hono";
import type { AppEnv, Principal } from "../context.js";

export interface AuditEvent {
  workspaceId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  /** Must never contain secret values. */
  metadata?: Record<string, unknown>;
}

function actorOf(principal: Principal | null) {
  if (!principal) {
    return { actorType: "system" as const, actorId: null, extra: {} };
  }
  switch (principal.type) {
    case "user":
      return { actorType: "user" as const, actorId: principal.userId, extra: {} };
    case "device":
      return {
        actorType: "device" as const,
        actorId: principal.deviceId,
        extra: { userId: principal.userId },
      };
    case "service_token":
      return {
        actorType: "service_token" as const,
        actorId: principal.tokenId,
        extra: {},
      };
  }
}

/**
 * Writes one audit entry. Pass a transaction as `db` to make the entry commit
 * or roll back together with the change it describes.
 */
export async function writeAudit(
  db: Executor,
  c: Context<AppEnv>,
  event: AuditEvent,
): Promise<void> {
  const { actorType, actorId, extra } = actorOf(c.get("principal"));
  await db.insert(auditLogs).values({
    workspaceId: event.workspaceId,
    actorType,
    actorId,
    action: event.action,
    targetType: event.targetType ?? null,
    targetId: event.targetId ?? null,
    metadata: { ...extra, ...event.metadata },
    ip: c.get("ip"),
    // Millisecond precision, so cursors built from this value round-trip exactly.
    createdAt: new Date(),
  });
}
