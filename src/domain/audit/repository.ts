import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: { display_name: string | null; email: string | null } | null;
}

export async function logAudit(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  await (supabase as any).from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    summary: params.summary ?? null,
    metadata: params.metadata ?? {},
  });
}

export async function listAuditLogs(opts?: {
  limit?: number;
  offset?: number;
  entityType?: string;
}): Promise<AuditLogEntry[]> {
  const { limit = 50, offset = 0, entityType } = opts ?? {};
  const supabase = createAdminClient();
  let query = (supabase as any)
    .from("audit_logs")
    .select("*, user:profiles(display_name, email)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (entityType) query = query.eq("entity_type", entityType);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AuditLogEntry[];
}
