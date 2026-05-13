import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Récupère l'utilisateur courant depuis le cookie de session.
 * Ne lance jamais — retourne null si pas authentifié.
 *
 * Important: utilise getUser() (et non getSession()) côté serveur car
 * getUser() revalide le JWT auprès du serveur Supabase, contrairement
 * à getSession() qui se contente de lire le cookie (manipulable).
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Garde de page protégée. À appeler en haut d'un Server Component
 * ou d'un layout privé. Redirige vers /login si pas de session.
 */
export async function requireUser(redirectTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const url = redirectTo
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login";
    redirect(url);
  }
  return user;
}

/**
 * Inverse: empêche un utilisateur déjà connecté d'accéder
 * aux pages publiques (login, register).
 */
export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
}
