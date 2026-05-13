"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/domain/auth/session";
import { muteCategory, unmuteCategory } from "./repository";

const schema = z.object({ category_id: z.string().uuid() });

export async function toggleCategoryMuteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = schema.safeParse({ category_id: formData.get("category_id") });
  if (!parsed.success) return;

  const wasMuted = String(formData.get("muted") ?? "") === "true";
  try {
    if (wasMuted) {
      await unmuteCategory(user.id, parsed.data.category_id);
    } else {
      await muteCategory(user.id, parsed.data.category_id);
    }
  } catch {
    // silencieux
  }
  revalidatePath("/settings");
  revalidatePath("/feed");
}
