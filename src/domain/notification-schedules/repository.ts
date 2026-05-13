import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import { createScheduleSchema, updateScheduleSchema } from "./schema";

export type Schedule = Database["public"]["Tables"]["notification_schedules"]["Row"];

export type ScheduleWithRelations = Schedule & {
  category: Pick<Database["public"]["Tables"]["categories"]["Row"], "id" | "name" | "color"> | null;
  session: Pick<Database["public"]["Tables"]["sessions"]["Row"], "id" | "name"> | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

const SELECT_WITH_RELATIONS =
  "*, category:categories(id, name, color), session:sessions(id, name)";

// ---------------------------------------------------------------------
// LIST / GET
// ---------------------------------------------------------------------
export async function listSchedules(): Promise<ScheduleWithRelations[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_schedules")
    .select(SELECT_WITH_RELATIONS)
    .order("next_run_at", { ascending: true, nullsFirst: false });
  if (error) throw fromPostgrestError(error);
  return (data ?? []) as ScheduleWithRelations[];
}

export async function getSchedule(id: string): Promise<ScheduleWithRelations | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_schedules")
    .select(SELECT_WITH_RELATIONS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data as ScheduleWithRelations | null;
}

export interface ScheduleTargets {
  team_ids: string[];
  user_ids: string[];
}

export async function getScheduleTargets(id: string): Promise<ScheduleTargets> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const [teamsRes, usersRes] = await Promise.all([
    supabase.from("schedule_target_teams").select("team_id").eq("schedule_id", id),
    supabase.from("schedule_target_users").select("user_id").eq("schedule_id", id),
  ]);
  if (teamsRes.error) throw fromPostgrestError(teamsRes.error);
  if (usersRes.error) throw fromPostgrestError(usersRes.error);
  return {
    team_ids: (teamsRes.data ?? []).map((r) => r.team_id),
    user_ids: (usersRes.data ?? []).map((r) => r.user_id),
  };
}

// ---------------------------------------------------------------------
// PERSIST TARGETS
// ---------------------------------------------------------------------
async function persistTargets(
  scheduleId: string,
  mode: "all" | "teams" | "users",
  teamIds: string[],
  userIds: string[],
): Promise<void> {
  const supabase = createClient();
  await Promise.all([
    supabase.from("schedule_target_teams").delete().eq("schedule_id", scheduleId),
    supabase.from("schedule_target_users").delete().eq("schedule_id", scheduleId),
  ]);
  if (mode === "teams" && teamIds.length > 0) {
    const rows = Array.from(new Set(teamIds)).map((team_id) => ({
      schedule_id: scheduleId,
      team_id,
    }));
    const { error } = await supabase.from("schedule_target_teams").insert(rows);
    if (error) throw fromPostgrestError(error);
  }
  if (mode === "users" && userIds.length > 0) {
    const rows = Array.from(new Set(userIds)).map((user_id) => ({
      schedule_id: scheduleId,
      user_id,
    }));
    const { error } = await supabase.from("schedule_target_users").insert(rows);
    if (error) throw fromPostgrestError(error);
  }
}

// ---------------------------------------------------------------------
// CREATE / UPDATE / DELETE
// ---------------------------------------------------------------------
export async function createSchedule(ownerId: string, input: unknown): Promise<Schedule> {
  const parsed = createScheduleSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_schedules")
    .insert({
      owner_id: ownerId,
      title: parsed.data.title,
      body: parsed.data.body,
      kind: parsed.data.kind,
      category_id: parsed.data.category_id,
      session_id: parsed.data.session_id,
      priority: parsed.data.priority,
      timezone: parsed.data.timezone,
      times: parsed.data.times,
      days_of_week: parsed.data.days_of_week,
      target_mode: parsed.data.target_mode,
      is_active: parsed.data.is_active,
    })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);

  await persistTargets(
    data.id,
    parsed.data.target_mode,
    parsed.data.target_team_ids,
    parsed.data.target_user_ids,
  );
  return data;
}

export async function updateSchedule(id: string, input: unknown): Promise<Schedule> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const parsed = updateScheduleSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const patch: Database["public"]["Tables"]["notification_schedules"]["Update"] = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.body !== undefined) patch.body = parsed.data.body;
  if (parsed.data.kind !== undefined) patch.kind = parsed.data.kind;
  if (parsed.data.category_id !== undefined) patch.category_id = parsed.data.category_id;
  if (parsed.data.session_id !== undefined) patch.session_id = parsed.data.session_id;
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;
  if (parsed.data.timezone !== undefined) patch.timezone = parsed.data.timezone;
  if (parsed.data.times !== undefined) patch.times = parsed.data.times;
  if (parsed.data.days_of_week !== undefined) patch.days_of_week = parsed.data.days_of_week;
  if (parsed.data.target_mode !== undefined) patch.target_mode = parsed.data.target_mode;
  if (parsed.data.is_active !== undefined) patch.is_active = parsed.data.is_active;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_schedules")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);

  if (
    parsed.data.target_mode !== undefined ||
    parsed.data.target_team_ids !== undefined ||
    parsed.data.target_user_ids !== undefined
  ) {
    await persistTargets(
      id,
      parsed.data.target_mode ?? data.target_mode,
      parsed.data.target_team_ids ?? [],
      parsed.data.target_user_ids ?? [],
    );
  }
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("notification_schedules").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

/**
 * Calcule la prochaine occurrence via la fonction Postgres compute_next_run.
 * Utilisable depuis l'UI pour prévisualiser sans avoir à enregistrer.
 */
export async function previewNextRun(input: {
  timezone: string;
  times: string[];
  days_of_week: number[];
  after?: string;
}): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("compute_next_run" as never, {
    p_timezone: input.timezone,
    p_times: input.times,
    p_days_of_week: input.days_of_week,
    p_after: input.after ?? new Date().toISOString(),
  } as never);
  if (error) throw fromPostgrestError(error);
  return (data as string | null) ?? null;
}
