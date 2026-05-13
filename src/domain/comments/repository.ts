import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import { createCommentSchema, updateCommentSchema } from "./schema";

export type Comment = Database["public"]["Tables"]["feed_item_comments"]["Row"];

export type CommentWithAuthor = Comment & {
  author: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

export async function listComments(feedItemId: string): Promise<CommentWithAuthor[]> {
  if (!isUuid(feedItemId)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feed_item_comments")
    .select("*")
    .eq("feed_item_id", feedItemId)
    .order("created_at", { ascending: true });
  if (error) throw fromPostgrestError(error);
  const items = data ?? [];
  if (items.length === 0) return [];

  // Charge les auteurs en une requête
  const userIds = Array.from(new Set(items.map((c) => c.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", userIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return items.map((c) => ({
    ...c,
    author: byId.get(c.user_id)
      ? {
          id: byId.get(c.user_id)!.id,
          display_name: byId.get(c.user_id)!.display_name,
          email: byId.get(c.user_id)!.email,
        }
      : null,
  }));
}

export async function getCommentCount(feedItemId: string): Promise<number> {
  if (!isUuid(feedItemId)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { count, error } = await supabase
    .from("feed_item_comments")
    .select("id", { count: "exact", head: true })
    .eq("feed_item_id", feedItemId);
  if (error) throw fromPostgrestError(error);
  return count ?? 0;
}

export async function createComment(userId: string, input: unknown): Promise<Comment> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feed_item_comments")
    .insert({
      feed_item_id: parsed.data.feed_item_id,
      body: parsed.data.body,
      user_id: userId,
    })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("feed_item_comments").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}
