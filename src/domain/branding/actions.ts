"use server";

import { revalidatePath } from "next/cache";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  updateAppSettings,
  updateCashierBannerSettings,
  type AppSettings,
} from "./repository";
import { updateBrandingSchema, updateCashierBannerSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

export async function updateBrandingAction(
  _prev: FormState<AppSettings>,
  formData: FormData,
): Promise<FormState<AppSettings>> {
  const profile = await requireDev();
  const parsed = updateBrandingSchema.safeParse({
    app_name: formData.get("app_name"),
    app_tagline: formData.get("app_tagline"),
    logo_url: formData.get("logo_url"),
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
    await updateAppSettings(profile.id, parsed.data);
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: t.errors.unexpected };
  }

  // Invalidation large — le branding apparaît dans tous les layouts.
  revalidatePath("/", "layout");
  return { status: "success", message: t.actionMessages.brandingUpdated };
}

export async function updateCashierBannerAction(
  _prev: FormState<AppSettings>,
  formData: FormData,
): Promise<FormState<AppSettings>> {
  const profile = await requireDev();
  const parsed = updateCashierBannerSchema.safeParse({
    cashier_banner_enabled: formData.get("cashier_banner_enabled"),
    cashier_banner_message: formData.get("cashier_banner_message"),
    cashier_banner_cta: formData.get("cashier_banner_cta"),
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
    await updateCashierBannerSettings(profile.id, parsed.data);
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: t.errors.unexpected };
  }

  // La bannière vit dans le layout (app), donc on invalide partout.
  revalidatePath("/", "layout");
  return { status: "success", message: t.settings.cashierBannerSaved };
}
