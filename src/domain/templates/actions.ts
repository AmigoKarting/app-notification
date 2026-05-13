"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
  type Template,
} from "./repository";
import { createTemplateSchema, updateTemplateSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function mapError(err: unknown): FormState<Template> {
  if (err instanceof RepositoryError) {
    return { status: "error", message: err.message };
  }
  return { status: "error", message: "Erreur inattendue" };
}

function readForm(formData: FormData) {
  return {
    name: formData.get("name"),
    kind: formData.get("kind") || undefined,
    title: formData.get("title"),
    body: formData.get("body"),
    priority: formData.get("priority") || undefined,
    category_id: formData.get("category_id"),
    action_label: formData.get("action_label"),
    action_url: formData.get("action_url"),
    send_channels: formData.getAll("send_channels").map(String).filter(Boolean),
  };
}

export async function createTemplateAction(
  _prev: FormState<Template>,
  formData: FormData,
): Promise<FormState<Template>> {
  const profile = await requireDev();
  const parsed = createTemplateSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await createTemplate(profile.id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function updateTemplateAction(
  id: string,
  _prev: FormState<Template>,
  formData: FormData,
): Promise<FormState<Template>> {
  await requireDev();
  const parsed = updateTemplateSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await updateTemplate(id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${id}`);
  return { status: "success", message: "Modèle mis à jour." };
}

export async function deleteTemplateAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteTemplate(id);
  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}
