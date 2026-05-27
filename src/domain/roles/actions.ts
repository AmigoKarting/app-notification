"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  createCustomRole,
  deleteCustomRoleBySlug,
  setRolePermissions,
  updateRoleMeta,
} from "./repository";
import { createRoleSchema, updateRoleSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function invalidateRoles() {
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  // Les checks de permission vivent dans plusieurs layouts → invalidation large.
  revalidatePath("/", "layout");
}

export async function createRoleAction(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  await requireDev();
  const t = getServerDictionary();

  const parsed = createRoleSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    permissions: formData.getAll("permissions").map(String),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: t.errors.invalidData,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createCustomRole(parsed.data);
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: t.errors.unexpected };
  }

  invalidateRoles();
  redirect("/admin/roles");
}

export async function updateRoleAction(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  await requireDev();
  const t = getServerDictionary();

  const parsed = updateRoleSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    permissions: formData.getAll("permissions").map(String),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: t.errors.invalidData,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await updateRoleMeta(parsed.data.slug, {
      name: parsed.data.name,
      description: parsed.data.description,
      color: parsed.data.color,
      icon: parsed.data.icon,
    });
    await setRolePermissions(parsed.data.slug, parsed.data.permissions);
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: t.errors.unexpected };
  }

  invalidateRoles();
  return { status: "success", message: t.rolesAdmin.updated };
}

export async function deleteRoleAction(formData: FormData): Promise<void> {
  await requireDev();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;
  try {
    await deleteCustomRoleBySlug(slug);
  } catch {
    // Échec silencieux côté UI — l'action redirige toujours vers la liste.
  }
  invalidateRoles();
  redirect("/admin/roles");
}
