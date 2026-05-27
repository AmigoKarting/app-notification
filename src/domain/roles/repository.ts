import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";

export type Role = Database["public"]["Tables"]["roles"]["Row"];
export type RoleWithPermissions = Role & { permissions: string[] };

/** Liste tous les rôles avec leurs permissions, triés (système d'abord). */
export async function listRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  const supabase = createClient();
  const [rolesRes, permsRes] = await Promise.all([
    supabase
      .from("roles")
      .select("*")
      .order("is_system", { ascending: false })
      .order("slug", { ascending: true }),
    supabase.from("role_permissions").select("role_slug, permission"),
  ]);
  if (rolesRes.error) throw fromPostgrestError(rolesRes.error);
  if (permsRes.error) throw fromPostgrestError(permsRes.error);

  const byRole = new Map<string, string[]>();
  for (const row of permsRes.data ?? []) {
    if (!byRole.has(row.role_slug)) byRole.set(row.role_slug, []);
    byRole.get(row.role_slug)!.push(row.permission);
  }
  return (rolesRes.data ?? []).map((r) => ({
    ...r,
    permissions: byRole.get(r.slug) ?? [],
  }));
}

export async function getRoleWithPermissions(
  slug: string,
): Promise<RoleWithPermissions | null> {
  const supabase = createClient();
  const [roleRes, permsRes] = await Promise.all([
    supabase.from("roles").select("*").eq("slug", slug).maybeSingle(),
    supabase.from("role_permissions").select("permission").eq("role_slug", slug),
  ]);
  if (roleRes.error) throw fromPostgrestError(roleRes.error);
  if (permsRes.error) throw fromPostgrestError(permsRes.error);
  if (!roleRes.data) return null;
  return { ...roleRes.data, permissions: (permsRes.data ?? []).map((p) => p.permission) };
}

/**
 * Crée un nouveau rôle custom — utilise la RPC qui étend l'enum app_role.
 * À appeler depuis une server action où on a déjà vérifié requireDev().
 */
export async function createCustomRole(input: {
  slug: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  permissions: string[];
}): Promise<void> {
  // RPC : doit utiliser le service role pour pouvoir ALTER TYPE.
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("create_custom_role", {
    p_slug: input.slug,
    p_name: input.name,
    p_description: input.description,
    p_color: input.color,
    p_icon: input.icon,
  });
  if (error) {
    throw new RepositoryError("validation", error.message);
  }
  if (input.permissions.length > 0) {
    await setRolePermissions(input.slug, input.permissions);
  }
}

export async function updateRoleMeta(
  slug: string,
  patch: { name: string; description: string | null; color: string; icon: string | null },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("roles")
    .update(patch)
    .eq("slug", slug);
  if (error) throw fromPostgrestError(error);
}

/**
 * Réécrit les permissions d'un rôle : delete + insert dans une boucle simple.
 * (Volume faible, simple à raisonner.)
 */
export async function setRolePermissions(
  roleSlug: string,
  permissions: string[],
): Promise<void> {
  const supabase = createClient();
  const { error: delErr } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_slug", roleSlug);
  if (delErr) throw fromPostgrestError(delErr);

  if (permissions.length === 0) return;
  const rows = Array.from(new Set(permissions)).map((p) => ({
    role_slug: roleSlug,
    permission: p,
  }));
  const { error: insErr } = await supabase
    .from("role_permissions")
    .insert(rows);
  if (insErr) throw fromPostgrestError(insErr);
}

export async function deleteCustomRoleBySlug(slug: string): Promise<void> {
  // RPC qui vérifie is_system et l'absence de profils utilisant ce rôle.
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("delete_custom_role", { p_slug: slug });
  if (error) throw new RepositoryError("validation", error.message);
}

/** Récupère les permissions actives pour un slug donné. */
export async function getPermissionsForRole(slug: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission")
    .eq("role_slug", slug);
  if (error) throw fromPostgrestError(error);
  return (data ?? []).map((r) => r.permission);
}
