"use server";

import { revalidatePath } from "next/cache";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  createBanner,
  deleteBanner,
  updateBanner,
  type RoleBanner,
} from "./repository";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function invalidate() {
  revalidatePath("/settings");
  // La bannière vit dans le layout (app) → invalidation large.
  revalidatePath("/", "layout");
}

export async function createBannerAction(
  _prev: FormState<RoleBanner>,
  formData: FormData,
): Promise<FormState<RoleBanner>> {
  await requireDev();
  const t = getServerDictionary();
  try {
    const created = await createBanner({
      role_slug: formData.get("role_slug"),
      enabled: formData.get("enabled"),
      message: formData.get("message"),
      cta_label: formData.get("cta_label"),
      cta_url: formData.get("cta_url"),
      icon: formData.get("icon"),
      color: formData.get("color"),
      dismiss_condition: formData.get("dismiss_condition"),
    });
    invalidate();
    return { status: "success", message: t.bannersAdmin.created, data: created };
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    if (err instanceof Error && "issues" in err) {
      return {
        status: "error",
        message: t.errors.invalidData,
        fieldErrors: fieldErrorsFromZod(err as import("zod").ZodError<unknown>),
      };
    }
    return { status: "error", message: t.errors.unexpected };
  }
}

export async function updateBannerAction(
  _prev: FormState<RoleBanner>,
  formData: FormData,
): Promise<FormState<RoleBanner>> {
  await requireDev();
  const t = getServerDictionary();
  try {
    const updated = await updateBanner({
      role_slug: formData.get("role_slug"),
      enabled: formData.get("enabled"),
      message: formData.get("message"),
      cta_label: formData.get("cta_label"),
      cta_url: formData.get("cta_url"),
      icon: formData.get("icon"),
      color: formData.get("color"),
      dismiss_condition: formData.get("dismiss_condition"),
    });
    invalidate();
    return { status: "success", message: t.bannersAdmin.updated, data: updated };
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: t.errors.unexpected };
  }
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  await requireDev();
  const slug = formData.get("role_slug")?.toString() ?? "";
  if (!slug) return;
  try {
    await deleteBanner(slug);
  } catch {
    // silent — la page se rafraîchit toujours
  }
  invalidate();
}
