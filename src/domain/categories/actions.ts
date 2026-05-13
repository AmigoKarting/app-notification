"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import {
  claimUnclaimedCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from "./repository";
import { createCategorySchema, updateCategorySchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function mapError(err: unknown): FormState<Category> {
  if (err instanceof RepositoryError) {
    if (err.code === "conflict") {
      return { status: "error", message: "Slug déjà utilisé.", fieldErrors: { slug: "Déjà pris" } };
    }
    return { status: "error", message: err.message };
  }
  return { status: "error", message: "Erreur inattendue" };
}

export async function createCategoryAction(
  _prev: FormState<Category>,
  formData: FormData,
): Promise<FormState<Category>> {
  const profile = await requireDev();
  const parsed = createCategorySchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    color: formData.get("color") || undefined,
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Données invalides", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  try {
    await createCategory(profile.id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/categories");
  revalidatePath("/feed");
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  id: string,
  _prev: FormState<Category>,
  formData: FormData,
): Promise<FormState<Category>> {
  await requireDev();
  const parsed = updateCategorySchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    color: formData.get("color") || undefined,
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Données invalides", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  try {
    await updateCategory(id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}`);
  revalidatePath("/feed");
  return { status: "success", message: "Catégorie mise à jour." };
}

export async function claimSystemCategoriesAction(): Promise<void> {
  const profile = await requireDev();
  await claimUnclaimedCategories(profile.id);
  revalidatePath("/admin/categories");
  revalidatePath("/feed");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteCategory(id);
  revalidatePath("/admin/categories");
  revalidatePath("/feed");
  redirect("/admin/categories");
}
