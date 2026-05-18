/**
 * Erreurs métier — permettent aux Server Actions / Route Handlers
 * de mapper proprement vers des messages utilisateur sans exposer
 * les internes de Supabase.
 */

import { getServerDictionary } from "@/lib/i18n/server";

export type RepositoryErrorCode =
  | "unauthorized"
  | "not_found"
  | "validation"
  | "conflict"
  | "forbidden"
  | "database";

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly cause?: unknown;

  constructor(code: RepositoryErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Mappe une PostgrestError → RepositoryError.
 * Les codes Postgres pertinents:
 *  - 23505: unique_violation        → conflict
 *  - 23503: foreign_key_violation   → validation (employee_id invalide)
 *  - 42501: insufficient_privilege  → forbidden (RLS)
 *  - PGRST116: row not found        → not_found
 */
export function fromPostgrestError(err: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}): RepositoryError {
  const t = getServerDictionary();
  const code = err.code ?? "";
  if (code === "23505") return new RepositoryError("conflict", t.errors.conflict, err);
  if (code === "23503") return new RepositoryError("validation", t.errors.invalidReference, err);
  if (code === "42501") return new RepositoryError("forbidden", t.errors.unauthorized, err);
  if (code === "PGRST116") return new RepositoryError("not_found", t.errors.notFound, err);
  return new RepositoryError("database", err.message ?? t.errors.database, err);
}
