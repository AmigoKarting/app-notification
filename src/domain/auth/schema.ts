import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .max(72, "72 caractères maximum")
    .regex(/[A-Za-z]/, "Doit contenir une lettre")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<"email" | "password", string>> }
  | { status: "success"; message?: string; redirect?: string };

export const idleAuthState: AuthFormState = { status: "idle" };
