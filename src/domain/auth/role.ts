import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Database } from "@/lib/supabase/database.types";
import { getCurrentUser } from "./session";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Récupère le profil de l'utilisateur courant. Retourne null si pas connecté.
 * Le trigger `handle_new_user` garantit qu'un profile existe pour tout user.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
}

/**
 * Garde de page admin. À utiliser dans les layouts/pages /admin/*.
 * Redirige vers /feed si l'utilisateur est connecté mais pas dev.
 * Redirige vers /login s'il n'est pas connecté.
 */
export async function requireDev(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "dev") redirect("/feed");
  return profile;
}

export function isDev(role: AppRole | null | undefined): boolean {
  return role === "dev";
}
