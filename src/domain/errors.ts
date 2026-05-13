/**
 * Erreurs métier — permettent aux Server Actions / Route Handlers
 * de mapper proprement vers des messages utilisateur sans exposer
 * les internes de Supabase.
 */

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
  const code = err.code ?? "";
  if (code === "23505") return new RepositoryError("conflict", "Un enregistrement identique existe déjà.", err);
  if (code === "23503") return new RepositoryError("validation", "Référence invalide (employé inconnu).", err);
  if (code === "42501") return new RepositoryError("forbidden", "Action non autorisée.", err);
  if (code === "PGRST116") return new RepositoryError("not_found", "Ressource introuvable.", err);
  return new RepositoryError("database", err.message ?? "Erreur base de données", err);
}
