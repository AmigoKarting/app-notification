import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SupervisorTask {
  id: string;
  task_key: string;
  section: string;
  label: string;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SupervisorDailyTask {
  id: string;
  task_id: string;
  date: string;
  supervisor_id: string;
  assigned_at: string | null;
  verified_at: string | null;
  done_by: string | null;
  rating: number | null;
  no_time_to_finish: boolean;
  quality_certified: boolean;
}

export async function listActiveSupervisorTasks(): Promise<SupervisorTask[]> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from("supervisor_tasks")
    .select("id, task_key, section, label, notes, sort_order, is_active")
    .eq("is_active", true)
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTodayDailyTasks(supervisorId: string): Promise<SupervisorDailyTask[]> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await (supabase as any)
    .from("supervisor_daily_tasks")
    .select("*")
    .eq("supervisor_id", supervisorId)
    .eq("date", today);
  if (error) throw error;
  return data ?? [];
}

export async function assignTask(taskId: string, supervisorId: string): Promise<void> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { error } = await (supabase as any)
    .from("supervisor_daily_tasks")
    .upsert(
      {
        task_id: taskId,
        date: today,
        supervisor_id: supervisorId,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "task_id,date,supervisor_id" },
    );
  if (error) throw error;
}

export async function unassignTask(taskId: string, supervisorId: string): Promise<void> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { error } = await (supabase as any)
    .from("supervisor_daily_tasks")
    .delete()
    .eq("task_id", taskId)
    .eq("date", today)
    .eq("supervisor_id", supervisorId);
  if (error) throw error;
}

export interface VerifyPayload {
  taskId: string;
  supervisorId: string;
  supervisorName: string | null;
  doneBy: string;
  rating: number;
  comment: string | null;
  noTimeToFinish: boolean;
  qualityCertified: boolean;
}

export interface SupervisorHistoryEntry {
  id: string;
  date: string;
  task_label: string;
  task_section: string;
  supervisor_name: string;
  done_by: string | null;
  rating: number | null;
  no_time_to_finish: boolean;
  quality_certified: boolean;
  comment: string | null;
  assigned_at: string | null;
  verified_at: string | null;
}

export async function listRecentSupervisorHistory(limit = 50): Promise<SupervisorHistoryEntry[]> {
  const supabase = createAdminClient();

  const { data: dailyTasks, error } = await (supabase as any)
    .from("supervisor_daily_tasks")
    .select("id, date, task_id, supervisor_id, supervisor_name, done_by, rating, comment, no_time_to_finish, quality_certified, assigned_at, verified_at")
    .order("date", { ascending: false })
    .order("verified_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!dailyTasks || dailyTasks.length === 0) return [];

  const rows = dailyTasks as Array<{
    id: string; date: string; task_id: string; supervisor_id: string;
    supervisor_name: string | null; done_by: string | null; rating: number | null;
    comment: string | null; no_time_to_finish: boolean; quality_certified: boolean;
    assigned_at: string | null; verified_at: string | null;
  }>;

  const taskIds = [...new Set(rows.map((r) => r.task_id))];
  const { data: tasks } = await (supabase as any)
    .from("supervisor_tasks")
    .select("id, label, section")
    .in("id", taskIds);
  const taskMap = new Map<string, { id: string; label: string; section: string }>(
    (tasks ?? []).map((t: any) => [t.id, t]),
  );

  const supervisorIds = [...new Set(rows.map((r) => r.supervisor_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name")
    .in("id", supervisorIds);
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return rows.map((r) => {
    const task = taskMap.get(r.task_id);
    const prof = profileMap.get(r.supervisor_id);
    const profileName = prof
      ? (prof.first_name && prof.last_name ? `${prof.first_name} ${prof.last_name}` : prof.display_name?.trim()) || "—"
      : "—";
    const supervisorName = r.supervisor_name || profileName;
    return {
      id: r.id,
      date: r.date,
      task_label: task?.label ?? "—",
      task_section: task?.section ?? "—",
      supervisor_name: supervisorName,
      done_by: r.done_by,
      rating: r.rating,
      comment: r.comment,
      no_time_to_finish: r.no_time_to_finish,
      quality_certified: r.quality_certified,
      assigned_at: r.assigned_at,
      verified_at: r.verified_at,
    };
  });
}

export async function verifyTask(payload: VerifyPayload): Promise<void> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { error } = await (supabase as any)
    .from("supervisor_daily_tasks")
    .update({
      verified_at: new Date().toISOString(),
      done_by: payload.doneBy,
      rating: payload.rating,
      comment: payload.comment,
      supervisor_name: payload.supervisorName,
      no_time_to_finish: payload.noTimeToFinish,
      quality_certified: payload.qualityCertified,
    })
    .eq("task_id", payload.taskId)
    .eq("date", today)
    .eq("supervisor_id", payload.supervisorId);
  if (error) throw error;
}
