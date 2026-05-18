"use client";

import { useTranslation } from "@/lib/i18n";

/**
 * Hints compacts pour expliquer le markdown et les variables dans les
 * formulaires de notification/planification/template. Détails fermés par
 * défaut (n'encombre pas), expansible d'un clic.
 */
export function FormattingHelp() {
  const { t } = useTranslation();
  return (
    <details className="text-xs text-neutral-500">
      <summary className="cursor-pointer select-none hover:text-neutral-700">
        {t.formatting.title}
      </summary>
      <div className="mt-2 space-y-2 rounded-lg bg-neutral-50 p-3 leading-relaxed">
        <div>
          <p className="mb-1 font-medium text-neutral-700">{t.formatting.markdown}</p>
          <ul className="space-y-0.5 font-mono text-[11px]">
            <li>
              <code>**{t.formatting.bold}**</code> → <strong>{t.formatting.bold}</strong>
            </li>
            <li>
              <code>*{t.formatting.italic}*</code> → <em>{t.formatting.italic}</em>
            </li>
            <li>
              <code>`{t.formatting.code}`</code> →{" "}
              <code className="rounded bg-neutral-100 px-1">{t.formatting.code}</code>
            </li>
            <li>
              <code>[texte](https://exemple.com)</code> → {t.formatting.clickableLink}
            </li>
            <li>{t.formatting.autoLinks}</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-medium text-neutral-700">{t.formatting.variables}</p>
          <ul className="space-y-0.5 font-mono text-[11px]">
            <li>
              <code>{"{name}"}</code> → {t.formatting.nameVar}
            </li>
            <li>
              <code>{"{email}"}</code> → {t.formatting.emailVar}
            </li>
          </ul>
          <p className="mt-1 text-[11px] text-neutral-500">
            {t.formatting.variablesNote}
          </p>
        </div>
      </div>
    </details>
  );
}
