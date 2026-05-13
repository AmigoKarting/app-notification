import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError } from "@/domain/errors";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
// Kept for backwards compatibility — email vit maintenant directement dans profiles.
export type ProfileWithEmail = Profile;

/**
 * Liste tous les profils. profiles.email est dénormalisé depuis auth.users
 * (cf. migration 0007). Une lecture simple via PostgREST suffit.
 */
export async function listProfilesWithEmail(): Promise<ProfileWithEmail[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  return (data ?? []) as ProfileWithEmail[];
}
