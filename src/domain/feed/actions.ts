"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDev } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { getServerDictionary } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { dispatchFeedItemExternal } from "./dispatcher";
import {
  createFeedItem,
  deleteFeedItem,
  duplicateFeedItem,
  updateFeedItem,
  type FeedItem,
} from "./repository";
import { createFeedItemSchema, updateFeedItemSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function mapError(err: unknown): FormState<FeedItem> {
  const t = getServerDictionary();
  if (err instanceof RepositoryError) {
    return { status: "error", message: err.message };
  }
  return { status: "error", message: t.errors.unexpected };
}

function readForm(formData: FormData) {
  return {
    kind: formData.get("kind"),
    title: formData.get("title"),
    body: formData.get("body"),
    category_id: formData.get("category_id"),
    session_id: formData.get("session_id"),
    priority: formData.get("priority") || undefined,
    due_date: formData.get("due_date"),
    published_at: formData.get("published_at"),
    expires_at: formData.get("expires_at"),
    target_mode: formData.get("target_mode") || undefined,
    target_team_ids: formData.getAll("target_team_ids").map(String).filter(Boolean),
    target_user_ids: formData.getAll("target_user_ids").map(String).filter(Boolean),
    is_draft: formData.get("is_draft") === "on" || formData.get("is_draft") === "true",
    is_pinned: formData.get("is_pinned") === "on" || formData.get("is_pinned") === "true",
    image_url: formData.get("image_url"),
    send_channels: formData.getAll("send_channels").map(String).filter(Boolean),
    action_label: formData.get("action_label"),
    action_url: formData.get("action_url"),
  };
}

export async function createFeedItemAction(
  _prev: FormState<FeedItem>,
  formData: FormData,
): Promise<FormState<FeedItem>> {
  const profile = await requireDev();
  const t = getServerDictionary();
  const parsed = createFeedItemSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: t.errors.invalidData,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  let created: FeedItem;
  try {
    created = await createFeedItem(profile.id, parsed.data);
  } catch (err) {
    return mapError(err);
  }

  // Si l'utilisateur a coché email/sms et que ce n'est pas un brouillon,
  // déclencher les envois externes. Best-effort — n'échoue jamais la création.
  if (!created.is_draft && created.send_channels.length > 0) {
    try {
      await dispatchFeedItemExternal({
        id: created.id,
        title: created.title,
        body: created.body,
        target_mode: created.target_mode,
        send_channels: created.send_channels,
        created_by: created.created_by,
      });
    } catch (err) {
      logger.warn("feed.dispatch.failed", {
        feedItemId: created.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  revalidatePath("/admin/feed");
  revalidatePath("/feed");
  redirect("/admin/feed");
}

export async function updateFeedItemAction(
  id: string,
  _prev: FormState<FeedItem>,
  formData: FormData,
): Promise<FormState<FeedItem>> {
  await requireDev();
  const t = getServerDictionary();
  const parsed = updateFeedItemSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: t.errors.invalidData,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await updateFeedItem(id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/feed");
  revalidatePath(`/admin/feed/${id}`);
  revalidatePath("/feed");
  return { status: "success", message: t.actionMessages.feedItemUpdated };
}

export async function deleteFeedItemAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteFeedItem(id);
  revalidatePath("/admin/feed");
  revalidatePath("/feed");
  redirect("/admin/feed");
}

/**
 * Toggle is_pinned depuis la liste — one-click.
 */
export async function toggleFeedItemPinAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  const isPinned = String(formData.get("is_pinned") ?? "") === "true";
  if (!id) return;
  try {
    await updateFeedItem(id, { is_pinned: !isPinned });
  } catch {
    // silencieux côté liste
  }
  revalidatePath("/admin/feed");
  revalidatePath("/feed");
}

/**
 * Duplique un feed_item — crée une copie en brouillon que l'admin peut ajuster.
 */
export async function duplicateFeedItemAction(formData: FormData): Promise<void> {
  const profile = await requireDev();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  let copy: FeedItem;
  try {
    copy = await duplicateFeedItem(id, profile.id);
  } catch (err) {
    logger.warn("feed.duplicate.failed", {
      id,
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }
  revalidatePath("/admin/feed");
  redirect(`/admin/feed/${copy.id}`);
}

// ---------------------------------------------------------------------
// ENGAGEMENT — accessible à tout user connecté (employé + dev)
// ---------------------------------------------------------------------

const idSchema = z.object({ feed_item_id: z.string().uuid() });

/**
 * Marque un item comme lu pour l'utilisateur courant.
 * INSERT idempotent grâce à PK composite.
 */
export async function markAsReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ feed_item_id: formData.get("feed_item_id") });
  if (!parsed.success) return;

  const supabase = createClient();
  await supabase
    .from("feed_item_reads")
    .upsert(
      { feed_item_id: parsed.data.feed_item_id, user_id: user.id },
      { onConflict: "feed_item_id,user_id", ignoreDuplicates: true },
    );

  revalidatePath("/feed");
}

/**
 * Retire l'état "lu" — marque comme non lu.
 */
export async function markAsUnreadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ feed_item_id: formData.get("feed_item_id") });
  if (!parsed.success) return;

  const supabase = createClient();
  await supabase
    .from("feed_item_reads")
    .delete()
    .eq("feed_item_id", parsed.data.feed_item_id)
    .eq("user_id", user.id);

  revalidatePath("/feed");
}

const reactionSchema = z.object({
  feed_item_id: z.string().uuid(),
  emoji: z.string().min(1).max(8),
});

/**
 * Toggle une réaction emoji : si déjà présente, on la retire; sinon on l'ajoute.
 */
export async function toggleReactionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = reactionSchema.safeParse({
    feed_item_id: formData.get("feed_item_id"),
    emoji: formData.get("emoji"),
  });
  if (!parsed.success) return;

  const supabase = createClient();
  // Vérifie si la réaction existe déjà
  const { data: existing } = await supabase
    .from("feed_item_reactions")
    .select("emoji")
    .eq("feed_item_id", parsed.data.feed_item_id)
    .eq("user_id", user.id)
    .eq("emoji", parsed.data.emoji)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("feed_item_reactions")
      .delete()
      .eq("feed_item_id", parsed.data.feed_item_id)
      .eq("user_id", user.id)
      .eq("emoji", parsed.data.emoji);
  } else {
    await supabase.from("feed_item_reactions").insert({
      feed_item_id: parsed.data.feed_item_id,
      user_id: user.id,
      emoji: parsed.data.emoji,
    });
  }

  revalidatePath("/feed");
}
