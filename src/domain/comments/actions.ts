"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/domain/auth/session";
import { createComment, deleteComment } from "./repository";
import { createCommentSchema } from "./schema";

export async function postCommentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = createCommentSchema.safeParse({
    feed_item_id: formData.get("feed_item_id"),
    body: formData.get("body"),
  });
  if (!parsed.success) return;
  try {
    await createComment(user.id, parsed.data);
  } catch {
    // silencieux
  }
  revalidatePath("/feed");
  revalidatePath(`/admin/feed/${parsed.data.feed_item_id}`);
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const feedItemId = String(formData.get("feed_item_id") ?? "");
  if (!id) return;
  try {
    await deleteComment(id);
  } catch {
    // silencieux
  }
  revalidatePath("/feed");
  if (feedItemId) revalidatePath(`/admin/feed/${feedItemId}`);
}
