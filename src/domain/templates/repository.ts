import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import { createTemplateSchema, updateTemplateSchema } from "./schema";

export type Template = Database["public"]["Tables"]["notification_templates"]["Row"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

export async function listTemplates(opts?: { search?: string }): Promise<Template[]> {
  const supabase = createClient();
  let query = supabase
    .from("notification_templates")
    .select("*")
    .order("name", { ascending: true });
  if (opts?.search) {
    query = query.or(`name.ilike.%${opts.search}%,title.ilike.%${opts.search}%`);
  }
  const { data, error } = await query;
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

export async function getTemplate(id: string): Promise<Template | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function createTemplate(ownerId: string, input: unknown): Promise<Template> {
  const parsed = createTemplateSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .insert({ ...parsed.data, owner_id: ownerId })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateTemplate(id: string, input: unknown): Promise<Template> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const parsed = updateTemplateSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("notification_templates").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}
