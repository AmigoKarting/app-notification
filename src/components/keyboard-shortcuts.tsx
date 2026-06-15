"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  label: string;
  action: () => void;
  devOnly?: boolean;
}

export function KeyboardShortcuts({ isDev }: { isDev: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: ShortcutDef[] = [
    { key: "h", label: t.shortcuts.goHome, action: () => router.push(isDev ? "/admin" : "/feed") },
    { key: "f", label: t.shortcuts.goFeed, action: () => router.push("/feed") },
    { key: "n", label: t.shortcuts.newNotification, action: () => router.push("/admin/feed/new"), devOnly: true },
    { key: "e", label: t.shortcuts.goEmployees, action: () => router.push("/admin/employees"), devOnly: true },
    { key: "r", label: t.shortcuts.goReminders, action: () => router.push("/admin/reminders"), devOnly: true },
    { key: "s", label: t.shortcuts.goSettings, action: () => router.push("/settings") },
    { key: "a", label: t.shortcuts.goAnalytics, action: () => router.push("/admin/analytics"), devOnly: true },
    { key: "/", label: t.shortcuts.focusSearch, action: () => {
      const input = document.querySelector<HTMLInputElement>('input[type="search"], input[name="q"], input[placeholder*="echerch"], input[placeholder*="earch"]');
      input?.focus();
    }},
    { key: "?", label: t.shortcuts.showHelp, action: () => setShowHelp(true) },
  ];

  const activeShortcuts = shortcuts.filter((s) => !s.devOnly || isDev);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ne pas intercepter dans les champs de formulaire
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Ignorer si un modifier inattendu est utilisé
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Escape ferme le dialog
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
        return;
      }

      for (const shortcut of activeShortcuts) {
        if (e.key === shortcut.key) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [activeShortcuts, showHelp],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl animate-scale-in dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t.shortcuts.title}
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-1.5">
          {activeShortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{s.label}</span>
              <kbd className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-mono text-xs font-medium text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {s.key === "/" ? "/" : s.key === "?" ? "?" : s.key.toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          {t.shortcuts.hint}
        </p>
      </div>
    </div>
  );
}
