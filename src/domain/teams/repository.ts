import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import { createTeamSchema, updateTeamSchema } from "./schema";

export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

export type TeamWithCount = Team & { member_count: number };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

export async function listTeams(): Promise<Team[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

export async function listTeamsWithMemberCount(): Promise<TeamWithCount[]> {
  const supabase = createClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw fromPostgrestError(error);
  if (!teams || teams.length === 0) return [];

  const { data: members } = await supabase.from("team_members").select("team_id");
  const counts = new Map<string, number>();
  for (const m of members ?? []) {
    counts.set(m.team_id, (counts.get(m.team_id) ?? 0) + 1);
  }
  return teams.map((t) => ({ ...t, member_count: counts.get(t.id) ?? 0 }));
}

export async function getTeam(id: string): Promise<Team | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function createTeam(ownerId: string, input: unknown): Promise<Team> {
  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({ ...parsed.data, owner_id: ownerId })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateTeam(id: string, input: unknown): Promise<Team> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const parsed = updateTeamSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

// ---------------------------------------------------------------------
// Membres
// ---------------------------------------------------------------------
export async function listTeamMemberIds(teamId: string): Promise<string[]> {
  if (!isUuid(teamId)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId);
  if (error) throw fromPostgrestError(error);
  return (data ?? []).map((r) => r.user_id);
}

/**
 * Remplace TOUS les membres de l'équipe par la liste fournie.
 * Approche simple: on supprime tout, on réinsère. Pour le scale,
 * on pourrait diff.
 */
export async function setTeamMembers(teamId: string, userIds: string[]): Promise<void> {
  if (!isUuid(teamId)) throw new RepositoryError("validation", "Identifiant invalide");
  const unique = Array.from(new Set(userIds.filter(isUuid)));

  const supabase = createClient();
  const { error: deleteError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId);
  if (deleteError) throw fromPostgrestError(deleteError);

  if (unique.length === 0) return;

  const rows = unique.map((user_id) => ({ team_id: teamId, user_id }));
  const { error: insertError } = await supabase.from("team_members").insert(rows);
  if (insertError) throw fromPostgrestError(insertError);
}
