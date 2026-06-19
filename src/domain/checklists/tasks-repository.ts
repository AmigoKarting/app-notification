import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import {
  createChecklistTaskSchema,
  updateChecklistTaskSchema,
} from "./tasks-schema";

export type ChecklistTask = Database["public"]["Tables"]["checklist_tasks"]["Row"];
export type ChecklistSection = ChecklistTask["section"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

/** Liste toutes les tâches (admin) — actives + inactives, triées. */
export async function listAllChecklistTasks(): Promise<ChecklistTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_tasks")
    .select("*")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

/** Liste les tâches actives filtrées par rôle cible. */
export async function listActiveChecklistTasks(targetRole?: string): Promise<ChecklistTask[]> {
  const supabase = createClient();
  let query = supabase
    .from("checklist_tasks")
    .select("*")
    .eq("is_active", true);
  if (targetRole) query = query.eq("target_role", targetRole);
  query = query
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const { data, error } = await query;
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

export async function createChecklistTask(input: unknown): Promise<ChecklistTask> {
  const parsed = createChecklistTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  const supabase = createClient();

  // Si sort_order = 0 (pas fourni), met la nouvelle tâche en fin de section
  let sortOrder = parsed.data.sort_order;
  if (sortOrder === 0) {
    const { data: last } = await supabase
      .from("checklist_tasks")
      .select("sort_order")
      .eq("section", parsed.data.section)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (last?.sort_order ?? 0) + 10;
  }

  const { data, error } = await supabase
    .from("checklist_tasks")
    .insert({
      task_key: parsed.data.task_key,
      section: parsed.data.section,
      label: parsed.data.label,
      sort_order: sortOrder,
      is_active: parsed.data.is_active,
      target_role: parsed.data.target_role,
    })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateChecklistTask(input: unknown): Promise<ChecklistTask> {
  const parsed = updateChecklistTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  if (!isUuid(parsed.data.id)) {
    throw new RepositoryError("validation", "Identifiant invalide");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_tasks")
    .update({
      section: parsed.data.section,
      label: parsed.data.label,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
      target_role: parsed.data.target_role,
    })
    .eq("id", parsed.data.id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteChecklistTask(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("checklist_tasks").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

export async function toggleChecklistTaskActive(
  id: string,
  active: boolean,
): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase
    .from("checklist_tasks")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw fromPostgrestError(error);
}
