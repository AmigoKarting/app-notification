"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  GROUP_LABELS,
  PERMISSIONS,
  getPermissionsByGroup,
  type PermissionGroup,
} from "@/domain/roles/permissions";

interface Props {
  initialSelected: string[];
  /** Si true → toutes les cases sont cochées et désactivées (rôle dev). */
  lockAll?: boolean;
}

export function PermissionsFieldset({ initialSelected, lockAll = false }: Props) {
  const { locale } = useTranslation();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(lockAll ? PERMISSIONS.map((p) => p.key) : initialSelected),
  );
  const grouped = getPermissionsByGroup();

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroup(group: PermissionGroup) {
    const keys = grouped[group].map((p) => p.key);
    const allOn = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (allOn) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  const groupOrder: PermissionGroup[] = ["feed", "checklist", "notifications", "admin", "settings"];

  return (
    <div className="space-y-5">
      {groupOrder.map((group) => {
        const items = grouped[group];
        if (items.length === 0) return null;
        const allOn = items.every((p) => selected.has(p.key));
        const label = locale === "en" ? GROUP_LABELS[group].en : GROUP_LABELS[group].fr;

        return (
          <fieldset
            key={group}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <legend className="flex items-center justify-between gap-4 px-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              <span>{label}</span>
              {!lockAll && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="rounded-md px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
                >
                  {allOn ? (locale === "en" ? "Uncheck all" : "Tout décocher") : (locale === "en" ? "Check all" : "Tout cocher")}
                </button>
              )}
            </legend>
            <ul className="mt-2 space-y-1">
              {items.map((p) => {
                const checked = selected.has(p.key);
                const lbl = locale === "en" ? p.labelEn : p.labelFr;
                const desc = locale === "en" ? p.descEn : p.descFr;
                return (
                  <li key={p.key}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2 transition hover:bg-neutral-50 dark:hover:bg-neutral-700/40">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={p.key}
                        checked={checked}
                        disabled={lockAll}
                        onChange={() => toggle(p.key)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {lbl}
                        </span>
                        {desc && (
                          <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                            {desc}
                          </span>
                        )}
                        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                          {p.key}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}
