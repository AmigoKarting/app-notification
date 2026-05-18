"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  createSession,
  deleteSession,
  updateSession,
  type AppSession,
} from "./repository";
import { createSessionSchema, updateSessionSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function mapError(err: unknown): FormState<AppSession> {
  const t = getServerDictionary();
  if (err instanceof RepositoryError) {
    if (err.code === "conflict") {
      return { status: "error", message: t.errors.slugTaken, fieldErrors: { slug: t.errors.alreadyTaken } };
    }
    return { status: "error", message: err.message };
  }
  return { status: "error", message: t.errors.unexpected };
}

export async function createSessionAction(
  _prev: FormState<AppSession>,
  formData: FormData,
): Promise<FormState<AppSession>> {
  const profile = await requireDev();
  const parsed = createSessionSchema.safeParse({
    category_id: formData.get("category_id"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    is_active: formData.get("is_active"),
  });
  const t = getServerDictionary();
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidData, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  try {
    await createSession(profile.id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/sessions");
  revalidatePath("/feed");
  redirect("/admin/sessions");
}

export async function updateSessionAction(
  id: string,
  _prev: FormState<AppSession>,
  formData: FormData,
): Promise<FormState<AppSession>> {
  await requireDev();
  const t = getServerDictionary();
  const parsed = updateSessionSchema.safeParse({
    category_id: formData.get("category_id"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    is_active: formData.get("is_active"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidData, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  try {
    await updateSession(id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${id}`);
  revalidatePath("/feed");
  return { status: "success", message: t.actionMessages.sessionUpdated };
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteSession(id);
  revalidatePath("/admin/sessions");
  revalidatePath("/feed");
  redirect("/admin/sessions");
}

/**
 * One-click toggle is_active depuis la liste.
 * Conséquence métier (centralisée ici + dans le worker):
 *   - Le worker des planifications skip les schedules dont la session est inactive.
 *   - Le /feed côté employé filtre déjà les feed_items dont la session est inactive.
 * Réactiver une session remet tout en route automatiquement.
 */
export async function toggleSessionAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!id) return;
  try {
    await updateSession(id, { is_active: !isActive });
  } catch {
    // silencieux côté liste
  }
  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${id}`);
  revalidatePath("/feed");
}
