"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { DATE_FORMAT_COOKIE } from "@/lib/i18n";
import type { DateFormat } from "@/lib/i18n";

export function DateFormatSection({ initial }: { initial: DateFormat }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [format, setFormat] = useState<DateFormat>(initial);

  const loc = locale === "en" ? "en-US" : "fr-FR";
  const now = new Date().toISOString();

  const preview = (fmt: DateFormat) => {
    if (fmt === "friendly") {
      return new Date(now).toLocaleString(loc, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return new Date(now).toLocaleString(loc, {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const options: { value: DateFormat; label: string; icon: string }[] = [
    { value: "short", label: t.settings.dateFormatShort, icon: "compact" },
    { value: "friendly", label: t.settings.dateFormatFriendly, icon: "calendar" },
  ];

  function handleChange(value: DateFormat) {
    setFormat(value);
    document.cookie = `${DATE_FORMAT_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.refresh();
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {t.settings.dateFormatLabel}
      </p>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        {t.settings.dateFormatDesc}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = format === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(opt.value)}
              aria-pressed={active}
              className={`flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-300"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs opacity-70">{preview(opt.value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
