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
  doneBy: string;
  rating: number;
  noTimeToFinish: boolean;
  qualityCertified: boolean;
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
      no_time_to_finish: payload.noTimeToFinish,
      quality_certified: payload.qualityCertified,
    })
    .eq("task_id", payload.taskId)
    .eq("date", today)
    .eq("supervisor_id", payload.supervisorId);
  if (error) throw error;
}
