import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "./schema";

export type Employee = Database["public"]["Tables"]["employees"]["Row"];

export interface ListEmployeesOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------
export async function createEmployee(
  userId: string,
  input: unknown,
): Promise<Employee> {
  const parsed = createEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert({
      user_id: userId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    })
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

// ---------------------------------------------------------------------
// READ — list
// ---------------------------------------------------------------------
export async function listEmployees(opts: ListEmployeesOptions = {}): Promise<Employee[]> {
  const { search, limit = 100, offset = 0 } = opts;
  const supabase = createClient();

  let query = supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search && search.trim().length > 0) {
    // Échappement minimal: les % et virgules cassent .or(); on les retire.
    const term = search.trim().replace(/[%,()]/g, "");
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

// ---------------------------------------------------------------------
// READ — by id
// ---------------------------------------------------------------------
export async function getEmployee(id: string): Promise<Employee | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw fromPostgrestError(error);
  return data;
}

// ---------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------
export async function updateEmployee(
  id: string,
  input: unknown,
): Promise<Employee> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");

  const parsed = updateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const patch: Database["public"]["Tables"]["employees"]["Update"] = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.email !== undefined) patch.email = parsed.data.email;
  if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone;

  if (Object.keys(patch).length === 0) {
    throw new RepositoryError("validation", "Aucun champ à mettre à jour");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
export async function deleteEmployee(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");

  const supabase = createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}
