"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DARK_MODE_STORAGE_KEY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isDarkMode as isDarkModeValue,
  isThemeName,
  themes,
  type DarkMode,
  type ThemeName,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  darkMode: DarkMode;
  setDarkMode: (mode: DarkMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  darkMode: "light",
  setDarkMode: () => {},
  isDark: false,
});

function applyTheme(theme: ThemeName): void {
  const shades = themes[theme].shades;
  const root = document.documentElement;
  for (const [shade, value] of Object.entries(shades)) {
    root.style.setProperty(`--brand-${shade}`, value);
  }
}

function applyDarkMode(mode: DarkMode): boolean {
  const root = document.documentElement;
  let isDark = false;
  if (mode === "dark") {
    isDark = true;
  } else if (mode === "system") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  root.classList.toggle("dark", isDark);
  return isDark;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [darkMode, setDarkModeState] = useState<DarkMode>("light");
  const [isDark, setIsDark] = useState(false);

  // Sync l'état React avec ce qui est en localStorage (le script inline a déjà
  // appliqué les CSS vars avant l'hydratation pour éviter le flash).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeName(saved)) setThemeState(saved);

      const savedDark = localStorage.getItem(DARK_MODE_STORAGE_KEY);
      if (isDarkModeValue(savedDark)) {
        setDarkModeState(savedDark);
        setIsDark(applyDarkMode(savedDark));
      }
    } catch {
      // localStorage indisponible (SSR / private mode) — ignore
    }
  }, []);

  // Écoute les changements de préférence système quand mode = "system"
  useEffect(() => {
    if (darkMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setIsDark(applyDarkMode("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [darkMode]);

  const setTheme = useCallback((next: ThemeName) => {
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    setThemeState(next);
  }, []);

  const setDarkMode = useCallback((mode: DarkMode) => {
    const result = applyDarkMode(mode);
    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
    setDarkModeState(mode);
    setIsDark(result);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, darkMode, setDarkMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Script inline injecté dans <head> pour appliquer le thème AVANT
 * l'hydratation React, et éviter un flash de couleur par défaut.
 * Gère à la fois le thème couleur ET le mode sombre.
 */
export function ThemeInitScript() {
  const themesShades: Record<string, Record<string, string>> = {};
  for (const [name, def] of Object.entries(themes)) {
    themesShades[name] = def.shades;
  }
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var dk=${JSON.stringify(DARK_MODE_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_THEME)};var t=${JSON.stringify(themesShades)};var n=localStorage.getItem(k)||d;var s=t[n]||t[d];var r=document.documentElement;for(var x in s){r.style.setProperty('--brand-'+x,s[x]);}var dm=localStorage.getItem(dk)||'light';if(dm==='dark'||(dm==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){r.classList.add('dark');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
