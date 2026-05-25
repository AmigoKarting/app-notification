import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";

interface Props {
  /** True si la caissière a déjà soumis sa checklist aujourd'hui (la bannière est alors masquée). */
  alreadySubmitted: boolean;
}

/**
 * Bannière de rappel affichée en haut de l'app pour les caissières
 * tant qu'elles n'ont pas rempli leur checklist du jour.
 * Server component — l'état "soumise ou pas" est calculé côté serveur.
 */
export function CashierChecklistBanner({ alreadySubmitted }: Props) {
  if (alreadySubmitted) return null;
  const t = getServerDictionary();

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
          <span className="text-base">📋</span>
          <span>{t.checklist.bannerTitle}</span>
        </p>
        <Link
          href="/checklist"
          className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
        >
          {t.checklist.bannerCta}
        </Link>
      </div>
    </div>
  );
}
