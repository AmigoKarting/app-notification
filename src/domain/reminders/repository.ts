import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import {
  createReminderSchema,
  reminderStatusEnum,
  updateReminderSchema,
} from "./schema";

export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type ReminderStatus = Reminder["status"];

export type ReminderWithEmployee = Reminder & {
  employee: Pick<
    Database["public"]["Tables"]["employees"]["Row"],
    "id" | "name" | "email"
  > | null;
};

export interface ListRemindersOptions {
  status?: ReminderStatus;
  employeeId?: string;
  upcomingOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

// ---------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------
export async function createReminder(
  userId: string,
  input: unknown,
): Promise<Reminder> {
  const parsed = createReminderSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      employee_id: parsed.data.employee_id,
      message: parsed.data.message,
      scheduled_at: parsed.data.scheduled_at,
      status: parsed.data.status,
    })
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

// ---------------------------------------------------------------------
// READ — list (avec jointure employé)
// ---------------------------------------------------------------------
export async function listReminders(
  opts: ListRemindersOptions = {},
): Promise<ReminderWithEmployee[]> {
  const { status, employeeId, upcomingOnly, search, limit = 100, offset = 0 } = opts;

  if (status && !reminderStatusEnum.safeParse(status).success) {
    throw new RepositoryError("validation", "Statut invalide");
  }
  if (employeeId && !isUuid(employeeId)) {
    throw new RepositoryError("validation", "Identifiant employé invalide");
  }

  const supabase = createClient();
  let query = supabase
    .from("reminders")
    .select("*, employee:employees(id, name, email)")
    .order("scheduled_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (employeeId) query = query.eq("employee_id", employeeId);
  if (upcomingOnly) query = query.gte("scheduled_at", new Date().toISOString());
  if (search) query = query.ilike("message", `%${search}%`);

  const { data, error } = await query;
  if (error) throw fromPostgrestError(error);
  return (data ?? []) as ReminderWithEmployee[];
}

// ---------------------------------------------------------------------
// READ — by id
// ---------------------------------------------------------------------
export async function getReminder(id: string): Promise<ReminderWithEmployee | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*, employee:employees(id, name, email)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw fromPostgrestError(error);
  return data as ReminderWithEmployee | null;
}

// ---------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------
export async function updateReminder(
  id: string,
  input: unknown,
): Promise<Reminder> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");

  const parsed = updateReminderSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const patch: Database["public"]["Tables"]["reminders"]["Update"] = {};
  if (parsed.data.employee_id !== undefined) patch.employee_id = parsed.data.employee_id;
  if (parsed.data.message !== undefined) patch.message = parsed.data.message;
  if (parsed.data.scheduled_at !== undefined) patch.scheduled_at = parsed.data.scheduled_at;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;

  if (Object.keys(patch).length === 0) {
    throw new RepositoryError("validation", "Aucun champ à mettre à jour");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminders")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
export async function deleteReminder(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");

  const supabase = createClient();
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

// ---------------------------------------------------------------------
// AGGREGATES — pour le dashboard
// ---------------------------------------------------------------------
export interface ReminderCounts {
  total: number;
  pending: number;
  sent: number;
  overdue: number;
}

export async function getReminderCounts(): Promise<ReminderCounts> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const [totalRes, pendingRes, sentRes, overdueRes] = await Promise.all([
    supabase.from("reminders").select("*", { count: "exact", head: true }),
    supabase.from("reminders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reminders").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("scheduled_at", nowIso),
  ]);

  for (const res of [totalRes, pendingRes, sentRes, overdueRes]) {
    if (res.error) throw fromPostgrestError(res.error);
  }

  return {
    total: totalRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    sent: sentRes.count ?? 0,
    overdue: overdueRes.count ?? 0,
  };
}
