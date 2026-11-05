import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export interface AuditInput {
  actorId?: string | null;
  actorRole?: string | null;
  clinicId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  request?: NextRequest | Request | null;
}

export function clientIp(req?: Request | null): string | null {
  if (!req) return null;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/**
 * Append-only audit trail. Never throws: an audit failure must not take down
 * a clinical or financial write, but it is logged loudly.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_events (
        id, actor_id, actor_role, clinic_id, action, entity, entity_id,
        before, after, ip, user_agent, request_id, created_at
      ) VALUES (
        ${randomUUID()},
        ${input.actorId ?? null},
        ${input.actorRole ?? null},
        ${input.clinicId ?? null},
        ${input.action},
        ${input.entity ?? null},
        ${input.entityId ?? null},
        ${input.before == null ? null : JSON.stringify(input.before)}::jsonb,
        ${input.after == null ? null : JSON.stringify(input.after)}::jsonb,
        ${clientIp(input.request ?? null)},
        ${input.request?.headers.get("user-agent") ?? null},
        ${randomUUID()},
        now()
      );
    `;
  } catch (err) {
    console.error("[audit] failed to write audit event", input.action, err);
  }
}
