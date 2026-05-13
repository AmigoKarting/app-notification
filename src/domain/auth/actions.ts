"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type AuthFormState, loginSchema, signupSchema } from "./schema";

// Note: on N'utilise PAS redirect() à l'intérieur d'actions appelées via
// useFormState — un bug connu de Next.js 14.x rend la réponse non parseable
// côté client. À la place, on retourne un état avec `redirect` et le client
// navigue via router.push().

const SAFE_REDIRECT = /^\/(?!\/)[A-Za-z0-9_\-./?=&%]*$/;

function safeRedirect(target: FormDataEntryValue | null | undefined, fallback = "/dashboard"): string {
  if (typeof target !== "string") return fallback;
  return SAFE_REDIRECT.test(target) ? target : fallback;
}

function getOrigin(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

function fieldErrorsFromZod(
  err: import("zod").ZodError<unknown>,
): Partial<Record<"email" | "password", string>> {
  const out: Partial<Record<"email" | "password", string>> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (key === "email" || key === "password") {
      out[key] ??= issue.message;
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Message générique : ne révèle pas si l'email existe ou non
    return { status: "error", message: "Identifiants invalides" };
  }

  return { status: "success", redirect: safeRedirect(formData.get("redirect")) };
}

// ---------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------
export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) return { status: "error", message: error.message };

  // Email confirmation activée: pas de session, on demande à l'utilisateur de vérifier
  if (!data.session) {
    return {
      status: "success",
      message: "Compte créé. Vérifiez votre email pour confirmer votre inscription.",
    };
  }

  return { status: "success", redirect: "/dashboard" };
}

// ---------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
