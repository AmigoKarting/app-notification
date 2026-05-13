import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "./schema";

export type Category = Database["public"]["Tables"]["categories"]["Row"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

export async function listCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

export async function countUnclaimedCategories(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .is("owner_id", null);
  if (error) throw fromPostgrestError(error);
  return count ?? 0;
}

export async function claimUnclaimedCategories(ownerId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ owner_id: ownerId })
    .is("owner_id", null)
    .select("id");
  if (error) throw fromPostgrestError(error);
  return data?.length ?? 0;
}

export async function getCategory(id: string): Promise<Category | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function createCategory(ownerId: string, input: unknown): Promise<Category> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, owner_id: ownerId })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateCategory(id: string, input: unknown): Promise<Category> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

export type { CreateCategoryInput, UpdateCategoryInput };
