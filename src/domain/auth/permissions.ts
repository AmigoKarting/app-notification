import "server-only";

import { cache } from "react";
import { getCurrentProfile } from "./role";
import { getPermissionsForRole } from "@/domain/roles/repository";

/**
 * Renvoie la liste de permissions du user courant (basée sur son rôle).
 * Mémoïsé par React pour la durée d'un même render.
 */
export const getCurrentUserPermissions = cache(async (): Promise<string[]> => {
  const profile = await getCurrentProfile();
  if (!profile) return [];
  return getPermissionsForRole(profile.role);
});

export async function hasPermission(permission: string): Promise<boolean> {
  const perms = await getCurrentUserPermissions();
  return perms.includes(permission);
}

export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  const perms = await getCurrentUserPermissions();
  return permissions.some((p) => perms.includes(p));
}
