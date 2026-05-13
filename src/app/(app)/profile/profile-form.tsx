"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, FormError } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  userId,
  initialName,
}: {
  userId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      const trimmed = name.trim();
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed === "" ? null : trimmed })
        .eq("id", userId);

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Nom affiché"
        name="display_name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        hint="Ce nom remplace ton email un peu partout dans l'app."
      />

      {error && <FormError message={error} />}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Profil mis à jour.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
