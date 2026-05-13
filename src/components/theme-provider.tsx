"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeName,
  themes,
  type ThemeName,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

function applyTheme(theme: ThemeName): void {
  const shades = themes[theme].shades;
  const root = document.documentElement;
  for (const [shade, value] of Object.entries(shades)) {
    root.style.setProperty(`--brand-${shade}`, value);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  // Sync l'état React avec ce qui est en localStorage (le script inline a déjà
  // appliqué les CSS vars avant l'hydratation pour éviter le flash).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeName(saved)) setThemeState(saved);
    } catch {
      // localStorage indisponible (SSR / private mode) — ignore
    }
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    setThemeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
 * Pas de dépendance React — c'est juste du JS pur sérialisé.
 */
export function ThemeInitScript() {
  const themesShades: Record<string, Record<string, string>> = {};
  for (const [name, def] of Object.entries(themes)) {
    themesShades[name] = def.shades;
  }
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_THEME)};var t=${JSON.stringify(themesShades)};var n=localStorage.getItem(k)||d;var s=t[n]||t[d];var r=document.documentElement;for(var x in s){r.style.setProperty('--brand-'+x,s[x]);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
