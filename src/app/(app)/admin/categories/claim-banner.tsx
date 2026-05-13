"use client";

import { useFormStatus } from "react-dom";
import { claimSystemCategoriesAction } from "@/domain/categories/actions";

function ClaimButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
    >
      {pending ? "..." : "Tout réclamer"}
    </button>
  );
}

export function ClaimSystemBanner({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-violet-900">
          {count} catégorie{count > 1 ? "s" : ""} système non revendiquée{count > 1 ? "s" : ""}
        </p>
        <p className="text-violet-700">
          Réclame-les pour pouvoir les modifier, les renommer ou les supprimer.
        </p>
      </div>
      <form action={claimSystemCategoriesAction}>
        <ClaimButton />
      </form>
    </div>
  );
}
