import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import { createBannerSchema, updateBannerSchema } from "./schema";

export type RoleBanner = Database["public"]["Tables"]["role_banners"]["Row"];

/** Toutes les bannières (admin). */
export async function listAllBanners(): Promise<RoleBanner[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_banners")
    .select("*")
    .order("role_slug", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

/** Bannière active pour un rôle donné (ou null si aucune / disabled). */
export async function getBannerForRole(roleSlug: string): Promise<RoleBanner | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_banners")
    .select("*")
    .eq("role_slug", roleSlug)
    .eq("enabled", true)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function createBanner(input: unknown): Promise<RoleBanner> {
  const parsed = createBannerSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_banners")
    .insert({
      role_slug: parsed.data.role_slug,
      enabled: parsed.data.enabled,
      message: parsed.data.message,
      cta_label: parsed.data.cta_label,
      cta_url: parsed.data.cta_url,
      icon: parsed.data.icon,
      color: parsed.data.color,
      dismiss_condition: parsed.data.dismiss_condition,
    })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateBanner(input: unknown): Promise<RoleBanner> {
  const parsed = updateBannerSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError(
      "validation",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_banners")
    .update({
      enabled: parsed.data.enabled,
      message: parsed.data.message,
      cta_label: parsed.data.cta_label,
      cta_url: parsed.data.cta_url,
      icon: parsed.data.icon,
      color: parsed.data.color,
      dismiss_condition: parsed.data.dismiss_condition,
    })
    .eq("role_slug", parsed.data.role_slug)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteBanner(roleSlug: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("role_banners")
    .delete()
    .eq("role_slug", roleSlug);
  if (error) throw fromPostgrestError(error);
}
