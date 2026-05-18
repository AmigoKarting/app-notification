"use client";

import { useTheme } from "@/components/theme-provider";
import { useTranslation } from "@/lib/i18n";
import { themes, type ThemeName, type DarkMode } from "@/lib/themes";

export function ThemeSection() {
  const { theme, setTheme, darkMode, setDarkMode } = useTheme();
  const { t } = useTranslation();

  const darkModeOptions: { value: DarkMode; label: string; icon: string }[] = [
    { value: "light", label: t.settings.lightMode, icon: "sun" },
    { value: "dark", label: t.settings.darkMode, icon: "moon" },
    { value: "system", label: t.settings.systemMode, icon: "monitor" },
  ];

  return (
    <div className="space-y-6">
      {/* Dark mode toggle */}
      <div>
        <p className="mb-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t.settings.darkModeLabel}
        </p>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          {t.settings.darkModeDesc}
        </p>
        <div className="flex gap-2">
          {darkModeOptions.map((opt) => {
            const active = darkMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDarkMode(opt.value)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-600"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
                }`}
              >
                {opt.icon === "sun" && <SunIcon />}
                {opt.icon === "moon" && <MoonIcon />}
                {opt.icon === "monitor" && <MonitorIcon />}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent color picker */}
      <div>
        <p className="mb-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t.settings.accentColor}
        </p>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
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
                className={`group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all duration-200 ${
                  active
                    ? "border-neutral-900 bg-neutral-50 dark:border-neutral-300 dark:bg-neutral-800"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                }`}
                style={{ minWidth: 76 }}
              >
                <span
                  className={`block h-10 w-10 rounded-full ring-2 transition ${
                    active ? "ring-neutral-900 dark:ring-neutral-300" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: def.swatchHex }}
                />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {def.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
