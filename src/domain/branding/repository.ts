import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import { updateBrandingSchema } from "./schema";

export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];

const DEFAULTS: AppSettings = {
  id: 1,
  app_name: "App Notification",
  app_tagline: null,
  logo_url: null,
  updated_at: new Date(0).toISOString(),
  updated_by: null,
};

/**
 * Récupère les paramètres globaux de l'app (singleton).
 * Mémoïsé par React pour qu'un même render ne fasse qu'une requête,
 * même si plusieurs composants l'appellent (header, page, etc.).
 */
export const getAppSettings = cache(async (): Promise<AppSettings> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    // En cas d'erreur (ex: migration pas encore appliquée), fallback sur les défauts.
    return DEFAULTS;
  }
  return data;
});

export async function updateAppSettings(
  updatedBy: string,
  input: unknown,
): Promise<AppSettings> {
  const parsed = updateBrandingSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .update({
      app_name: parsed.data.app_name,
      app_tagline: parsed.data.app_tagline,
      logo_url: parsed.data.logo_url,
      updated_by: updatedBy,
    })
    .eq("id", 1)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}
