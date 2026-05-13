import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import { createSessionSchema, updateSessionSchema } from "./schema";

export type AppSession = Database["public"]["Tables"]["sessions"]["Row"];
export type AppSessionWithCategory = AppSession & {
  category: Pick<
    Database["public"]["Tables"]["categories"]["Row"],
    "id" | "name" | "color" | "icon"
  > | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

export async function listSessions(
  opts: { categoryId?: string } = {},
): Promise<AppSessionWithCategory[]> {
  const supabase = createClient();
  let query = supabase
    .from("sessions")
    .select("*, category:categories(id, name, color, icon)")
    .order("starts_at", { ascending: false });
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);

  const { data, error } = await query;
  if (error) throw fromPostgrestError(error);
  return (data ?? []) as AppSessionWithCategory[];
}

export interface SessionStats {
  feed_count: number;
  schedule_count: number;
}

export async function getSessionStats(id: string): Promise<SessionStats> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const [feedRes, schedRes] = await Promise.all([
    supabase
      .from("feed_items")
      .select("id", { count: "exact", head: true })
      .eq("session_id", id),
    supabase
      .from("notification_schedules")
      .select("id", { count: "exact", head: true })
      .eq("session_id", id),
  ]);
  return {
    feed_count: feedRes.count ?? 0,
    schedule_count: schedRes.count ?? 0,
  };
}

export async function listActiveSessions(): Promise<AppSession[]> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", nowIso)
    .gte("ends_at", nowIso)
    .order("starts_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

export async function getSession(id: string): Promise<AppSession | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function createSession(ownerId: string, input: unknown): Promise<AppSession> {
  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ ...parsed.data, owner_id: ownerId })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateSession(id: string, input: unknown): Promise<AppSession> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const parsed = updateSessionSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

export function isSessionActive(s: Pick<AppSession, "starts_at" | "ends_at" | "is_active">): boolean {
  if (!s.is_active) return false;
  const now = Date.now();
  return new Date(s.starts_at).getTime() <= now && new Date(s.ends_at).getTime() >= now;
}
