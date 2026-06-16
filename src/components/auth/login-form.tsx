"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const lookupRes = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!lookupRes.ok) {
        setError(t.auth.invalidCredentials);
        return;
      }

      const { email } = await lookupRes.json();

      const supabase = createClient();
      const actualPassword = `pin-${password}`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: actualPassword,
      });

      if (error) {
        setError(t.auth.invalidCredentials);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.unexpectedError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.auth.accountName}</span>
        <input
          type="text"
          autoComplete="username"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.auth.accountNamePlaceholder}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.auth.password}</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.auth.passwordPlaceholder}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          {t.auth.passwordHint}
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
        {pending ? t.auth.loggingIn : t.auth.login}
      </button>
    </form>
  );
}
