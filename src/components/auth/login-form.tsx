"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      // Ajoute le même préfixe que le signup (Supabase exige 6 chars min)
      const actualPassword = `pin-${password}`;
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: actualPassword,
      });

      if (error) {
        setError("Identifiants invalides");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Adresse courriel</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="xavier@exemple.com"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Mot de passe</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="4 derniers chiffres de ton téléphone"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          Les 4 derniers chiffres de ton numéro de téléphone
        </span>
      </label>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 py-2 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
