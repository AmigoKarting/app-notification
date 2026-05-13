/**
 * Type d'état générique pour les Server Actions appelées avec useFormState.
 * Discrimination par `status` pour une UI exhaustive et type-safe.
 */
export type FormState<T = unknown> =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; message?: string; data?: T };

export const idleFormState: FormState = { status: "idle" };
