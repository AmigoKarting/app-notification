"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { type FormState } from "@/domain/form-state";
import { CHECKLIST_ITEMS, TOTAL_ITEMS } from "./items";
import { hasSubmittedToday } from "./repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerDictionary } from "@/lib/i18n/server";

export async function submitChecklistAction(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  const t = getServerDictionary();
  const user = await requireUser();
  const profile = await getCurrentProfile();

  if (profile?.role !== "caissiere" && profile?.role !== "dev") {
    return { status: "error", message: t.errors.unauthorized };
  }

  const already = await hasSubmittedToday(user.id);
  if (already) {
    return { status: "error", message: t.checklist.alreadyDone };
  }

  const checkedItems = formData.getAll("items").map(String);
  const validKeys = new Set(CHECKLIST_ITEMS.map((i) => i.key));
  const completedItems = checkedItems.filter((k) => validKeys.has(k));
  const notes = formData.get("notes")?.toString().trim() || null;

  const supabase = createAdminClient();

  const { error } = await supabase.from("cashier_checklists").insert({
    user_id: user.id,
    completed_items: completedItems,
    total_items: TOTAL_ITEMS,
    notes,
  });

  if (error) {
    return { status: "error", message: t.errors.unexpected };
  }

  const cashierName =
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.display_name?.trim()) || user.email || "Caissière";

  const count = completedItems.length;
  const notifTitle = t.checklist.notifTitle.replace("{name}", cashierName);
  const notifBody = t.checklist.notifBody
    .replace("{count}", String(count))
    .replace("{total}", String(TOTAL_ITEMS));

  await supabase.from("feed_items").insert({
    kind: "notification" as const,
    status: "sent" as const,
    title: notifTitle,
    body: notifBody + (notes ? `\n\n📝 ${notes}` : ""),
    priority: "normal" as const,
    target_mode: "all" as const,
    is_draft: false,
    is_pinned: false,
    send_channels: ["push"],
    created_by: user.id,
    published_at: new Date().toISOString(),
  });

  revalidatePath("/checklist");
  revalidatePath("/feed");
  revalidatePath("/admin/checklists");

  return { status: "success", message: t.checklist.submitSuccess };
}
