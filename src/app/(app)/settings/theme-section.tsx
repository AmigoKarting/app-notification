"use client";

import { useTheme } from "@/components/theme-provider";
import { useTranslation } from "@/lib/i18n";
import { themes, type ThemeName } from "@/lib/themes";

export function ThemeSection() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-neutral-800">{t.settings.accentColor}</p>
      <p className="mb-4 text-xs text-neutral-500">
        {t.settings.accentColorDesc}
      </p>

      <div className="flex flex-wrap gap-3">
        {(Object.keys(themes) as ThemeName[]).map((name) => {
          const def = themes[name];
          const active = theme === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setTheme(name)}
              aria-pressed={active}
              className={`group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition ${
                active
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
              style={{ minWidth: 76 }}
            >
              <span
                className={`block h-10 w-10 rounded-full ring-2 transition ${
                  active ? "ring-neutral-900" : "ring-transparent"
                }`}
                style={{ backgroundColor: def.swatchHex }}
              />
              <span className="text-xs font-medium text-neutral-700">{def.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
