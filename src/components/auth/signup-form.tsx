"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function formatPhone(raw: string): string {
  // Garde seulement les chiffres
  const digits = raw.replace(/\D/g, "");
  // Format: XXX-XXX-XXXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Extrait les 4 derniers chiffres du téléphone
  function getLast4(phoneValue: string): string {
    const digits = phoneValue.replace(/\D/g, "");
    return digits.slice(-4);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!trimmedFirst) {
      setError("Le prénom est obligatoire");
      return;
    }
    if (!trimmedLast) {
      setError("Le nom est obligatoire");
      return;
    }
    if (phoneDigits.length < 10) {
      setError("Numéro de téléphone invalide (10 chiffres minimum)");
      return;
    }
    if (!trimmedEmail) {
      setError("L'adresse courriel est obligatoire");
      return;
    }

    const last4 = getLast4(phone);
    if (last4.length < 4) {
      setError("Le numéro de téléphone doit avoir au moins 4 chiffres");
      return;
    }

    // Le mot de passe = préfixe + 4 derniers chiffres (Supabase exige 6 chars min)
    const password = `pin-${last4}`;
    const formattedPhone = formatPhone(phoneDigits);

    setPending(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            phone: formattedPhone,
            phone_last4: last4,
          },
        },
      });

      if (error) {
        if (error.message.includes("password")) {
          setError("Erreur lors de la création du compte. Vérifie tes informations.");
        } else {
          setError(error.message);
        }
        return;
      }

      if (!data.session) {
        setSuccess("Compte créé. Vérifie ton courriel pour confirmer ton inscription.");
        return;
      }

      // Mettre à jour le profil avec les infos supplémentaires
      await supabase
        .from("profiles")
        .update({
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone: formattedPhone,
          phone_last4: last4,
          display_name: `${trimmedFirst} ${trimmedLast}`,
        })
        .eq("id", data.user.id);

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {success}
      </div>
    );
  }

  const last4Preview = getLast4(phone);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Prénom</span>
          <input
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jean"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nom</span>
          <input
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Tremblay"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Numéro de téléphone</span>
        <input
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="514-555-1234"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        />
        {last4Preview.length === 4 && (
          <span className="mt-1 block text-xs text-neutral-500">
            Ton mot de passe sera : <strong>{last4Preview}</strong> (4 derniers chiffres)
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Adresse courriel</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jean@exemple.com"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        />
      </label>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 py-2 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer mon compte"}
      </button>
    </form>
  );
}
