"use server";

import { revalidatePath } from "next/cache";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  createChecklistTask,
  deleteChecklistTask,
  toggleChecklistTaskActive,
  updateChecklistTask,
  type ChecklistTask,
} from "./tasks-repository";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function revalidateChecklist() {
  revalidatePath("/checklist");
  revalidatePath("/admin/checklist-tasks");
  revalidatePath("/admin/checklists");
}

export async function createChecklistTaskAction(
  _prev: FormState<ChecklistTask>,
  formData: FormData,
): Promise<FormState<ChecklistTask>> {
  await requireDev();
  const t = getServerDictionary();
  try {
    const created = await createChecklistTask({
      task_key: formData.get("task_key"),
      section: formData.get("section"),
      label: formData.get("label"),
      sort_order: formData.get("sort_order"),
      is_active: formData.get("is_active"),
    });
    revalidateChecklist();
    return { status: "success", message: t.checklistAdmin.created, data: created };
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    if (err instanceof Error && "issues" in err) {
      const ze = err as import("zod").ZodError<unknown>;
      return {
        status: "error",
        message: t.errors.invalidData,
        fieldErrors: fieldErrorsFromZod(ze),
      };
    }
    return { status: "error", message: t.errors.unexpected };
  }
}

export async function updateChecklistTaskAction(
  _prev: FormState<ChecklistTask>,
  formData: FormData,
): Promise<FormState<ChecklistTask>> {
  await requireDev();
  const t = getServerDictionary();
  try {
    const updated = await updateChecklistTask({
      id: formData.get("id"),
      section: formData.get("section"),
      label: formData.get("label"),
      sort_order: formData.get("sort_order"),
      is_active: formData.get("is_active"),
    });
    revalidateChecklist();
    return { status: "success", message: t.checklistAdmin.updated, data: updated };
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: t.errors.unexpected };
  }
}

export async function deleteChecklistTaskAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = formData.get("id")?.toString() ?? "";
  await deleteChecklistTask(id);
  revalidateChecklist();
}

export async function toggleChecklistTaskAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = formData.get("id")?.toString() ?? "";
  const active = formData.get("active") === "true";
  await toggleChecklistTaskActive(id, active);
  revalidateChecklist();
}
