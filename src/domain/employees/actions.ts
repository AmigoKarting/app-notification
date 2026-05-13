"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/domain/auth/session";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import {
  createEmployee,
  deleteEmployee,
  updateEmployee,
  type Employee,
} from "./repository";
import { createEmployeeSchema, updateEmployeeSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}

function mapRepositoryError(err: unknown): FormState<Employee> {
  if (err instanceof RepositoryError) {
    if (err.code === "conflict") {
      return {
        status: "error",
        message: "Un employé avec cet email existe déjà.",
        fieldErrors: { email: "Email déjà utilisé" },
      };
    }
    return { status: "error", message: err.message };
  }
  return { status: "error", message: "Erreur inattendue" };
}

// ---------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------
export async function createEmployeeAction(
  _prev: FormState<Employee>,
  formData: FormData,
): Promise<FormState<Employee>> {
  const user = await requireUser();

  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createEmployee(user.id, parsed.data);
  } catch (err) {
    return mapRepositoryError(err);
  }

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  redirect("/employees");
}

// ---------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------
export async function updateEmployeeAction(
  id: string,
  _prev: FormState<Employee>,
  formData: FormData,
): Promise<FormState<Employee>> {
  await requireUser();

  const parsed = updateEmployeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await updateEmployee(id, parsed.data);
  } catch (err) {
    return mapRepositoryError(err);
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  return { status: "success", message: "Modifications enregistrées." };
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
export async function deleteEmployeeAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteEmployee(id);
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  redirect("/employees");
}
