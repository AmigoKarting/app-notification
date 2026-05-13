import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

/**
 * Renvoie les IDs des catégories que l'utilisateur a mises en sourdine.
 * Utilisé par listFeedItems pour filtrer côté affichage.
 */
export async function listMutedCategoryIds(userId: string): Promise<string[]> {
  if (!isUuid(userId)) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("category_mutes")
    .select("category_id")
    .eq("user_id", userId);
  if (error) throw fromPostgrestError(error);
  return (data ?? []).map((r) => r.category_id);
}

export async function muteCategory(userId: string, categoryId: string): Promise<void> {
  if (!isUuid(userId) || !isUuid(categoryId))
    throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase
    .from("category_mutes")
    .upsert(
      { user_id: userId, category_id: categoryId },
      { onConflict: "user_id,category_id", ignoreDuplicates: true },
    );
  if (error) throw fromPostgrestError(error);
}

export async function unmuteCategory(userId: string, categoryId: string): Promise<void> {
  if (!isUuid(userId) || !isUuid(categoryId))
    throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase
    .from("category_mutes")
    .delete()
    .eq("user_id", userId)
    .eq("category_id", categoryId);
  if (error) throw fromPostgrestError(error);
}
