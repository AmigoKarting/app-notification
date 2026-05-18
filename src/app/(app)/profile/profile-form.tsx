"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, FormError } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function ProfileForm({
  userId,
  initialName,
  initialFirstName,
  initialLastName,
  initialPhone,
}: {
  userId: string;
  initialName: string;
  initialFirstName: string;
  initialLastName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(initialPhone);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!trimmedFirst) {
      setError(t.profileForm.firstNameRequired);
      return;
    }
    if (!trimmedLast) {
      setError(t.profileForm.lastNameRequired);
      return;
    }

    const formattedPhone = formatPhone(phoneDigits);
    const last4 = phoneDigits.slice(-4);

    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone: formattedPhone,
          phone_last4: last4,
          display_name: `${trimmedFirst} ${trimmedLast}`,
        })
        .eq("id", userId);

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.profileForm.unexpectedError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.profileForm.firstName}</span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={80}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.profileForm.lastName}</span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={80}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.profileForm.phone}</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          {t.profileForm.phoneHint}
        </span>
      </label>

      {error && <FormError message={error} />}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t.profileForm.updated}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
      </div>
    </form>
  );
}
