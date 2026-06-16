"use client";

import { useFormStatus } from "react-dom";
import { claimSystemCategoriesAction } from "@/domain/categories/actions";
import { useTranslation } from "@/lib/i18n";

function ClaimButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
    >
      {pending ? "..." : label}
    </button>
  );
}

export function ClaimSystemBanner({ count }: { count: number }) {
  const { t } = useTranslation();
  const message = count > 1
    ? t.claimBanner.unclaimedPlural.replace("{count}", String(count))
    : t.claimBanner.unclaimedSingular.replace("{count}", String(count));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-brand-900">
          {message}
        </p>
        <p className="text-brand-700">
          {t.claimBanner.claimDesc}
        </p>
      </div>
      <form action={claimSystemCategoriesAction}>
        <ClaimButton label={t.claimBanner.claimAll} />
      </form>
    </div>
  );
}
