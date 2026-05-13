"use server";

import { revalidatePath } from "next/cache";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import { updateAppSettings, type AppSettings } from "./repository";
import { updateBrandingSchema } from "./schema";

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
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await updateAppSettings(profile.id, parsed.data);
  } catch (err) {
    if (err instanceof RepositoryError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: "Erreur inattendue" };
  }

  // Invalidation large — le branding apparaît dans tous les layouts.
  revalidatePath("/", "layout");
  return { status: "success", message: "Marque mise à jour." };
}
