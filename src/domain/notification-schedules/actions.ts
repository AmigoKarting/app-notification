"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import {
  createSchedule,
  deleteSchedule,
  previewNextRun,
  updateSchedule,
  type Schedule,
} from "./repository";
import { createScheduleSchema, updateScheduleSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function mapError(err: unknown): FormState<Schedule> {
  if (err instanceof RepositoryError) {
    return { status: "error", message: err.message };
  }
  return { status: "error", message: "Erreur inattendue" };
}

function readForm(formData: FormData) {
  return {
    title: formData.get("title"),
    body: formData.get("body"),
    kind: formData.get("kind") || undefined,
    category_id: formData.get("category_id"),
    session_id: formData.get("session_id"),
    priority: formData.get("priority") || undefined,
    timezone: formData.get("timezone"),
    times: formData.getAll("times").map(String).filter(Boolean),
    days_of_week: formData
      .getAll("days_of_week")
      .map(String)
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n)),
    target_mode: formData.get("target_mode") || undefined,
    target_team_ids: formData.getAll("target_team_ids").map(String).filter(Boolean),
    target_user_ids: formData.getAll("target_user_ids").map(String).filter(Boolean),
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
  };
}

export async function createScheduleAction(
  _prev: FormState<Schedule>,
  formData: FormData,
): Promise<FormState<Schedule>> {
  const profile = await requireDev();
  const parsed = createScheduleSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await createSchedule(profile.id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/schedules");
  redirect("/admin/schedules");
}

export async function updateScheduleAction(
  id: string,
  _prev: FormState<Schedule>,
  formData: FormData,
): Promise<FormState<Schedule>> {
  await requireDev();
  const parsed = updateScheduleSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await updateSchedule(id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/schedules");
  revalidatePath(`/admin/schedules/${id}`);
  return { status: "success", message: "Planification mise à jour." };
}

export async function deleteScheduleAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteSchedule(id);
  revalidatePath("/admin/schedules");
  redirect("/admin/schedules");
}

/**
 * Toggle is_active depuis la liste — usage one-click.
 */
export async function toggleScheduleAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!id) return;
  await updateSchedule(id, { is_active: !isActive });
  revalidatePath("/admin/schedules");
}

/**
 * Exposé pour le client: preview de la prochaine exécution sans save.
 */
export async function previewScheduleAction(input: {
  timezone: string;
  times: string[];
  days_of_week: number[];
}): Promise<string | null> {
  await requireDev();
  if (input.times.length === 0 || input.days_of_week.length === 0) return null;
  return previewNextRun(input);
}
