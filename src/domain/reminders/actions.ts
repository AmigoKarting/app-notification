"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/domain/auth/session";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  createReminder,
  deleteReminder,
  updateReminder,
  type Reminder,
} from "./repository";
import { createReminderSchema, updateReminderSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}

function mapRepositoryError(err: unknown): FormState<Reminder> {
  const t = getServerDictionary();
  if (err instanceof RepositoryError) {
    if (err.code === "validation") {
      return {
        status: "error",
        message: t.errors.invalidEmployee,
        fieldErrors: { employee_id: t.errors.employeeNotFound },
      };
    }
    return { status: "error", message: err.message };
  }
  return { status: "error", message: t.errors.unexpected };
}

// ---------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------
export async function createReminderAction(
  _prev: FormState<Reminder>,
  formData: FormData,
): Promise<FormState<Reminder>> {
  const user = await requireUser();

  const parsed = createReminderSchema.safeParse({
    employee_id: formData.get("employee_id"),
    message: formData.get("message"),
    scheduled_at: formData.get("scheduled_at"),
    status: formData.get("status") || undefined,
  });
  const t = getServerDictionary();
  if (!parsed.success) {
    return {
      status: "error",
      message: t.errors.invalidData,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createReminder(user.id, parsed.data);
  } catch (err) {
    return mapRepositoryError(err);
  }

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  redirect("/reminders");
}

// ---------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------
export async function updateReminderAction(
  id: string,
  _prev: FormState<Reminder>,
  formData: FormData,
): Promise<FormState<Reminder>> {
  await requireUser();

  const t = getServerDictionary();
  const parsed = updateReminderSchema.safeParse({
    employee_id: formData.get("employee_id"),
    message: formData.get("message"),
    scheduled_at: formData.get("scheduled_at"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: t.errors.invalidData,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await updateReminder(id, parsed.data);
  } catch (err) {
    return mapRepositoryError(err);
  }

  revalidatePath("/reminders");
  revalidatePath(`/reminders/${id}`);
  revalidatePath("/dashboard");
  return { status: "success", message: t.actionMessages.saved };
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
export async function deleteReminderAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteReminder(id);
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  redirect("/reminders");
}

// ---------------------------------------------------------------------
// CANCEL — quick action depuis la liste
// ---------------------------------------------------------------------
export async function cancelReminderAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    await updateReminder(id, { status: "cancelled" });
  } catch {
    // silencieux côté list
  }
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
}
