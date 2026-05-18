/**
 * Palette de couleurs d'accent disponibles dans l'app.
 * Chaque shade est exprimée en triplet RGB (espace, pas virgule)
 * pour s'intégrer avec `rgb(var(--brand-XXX) / <alpha>)`.
 *
 * Pour ajouter un thème: copie un bloc, change les valeurs.
 */

export type ThemeName =
  | "violet"
  | "indigo"
  | "blue"
  | "emerald"
  | "rose"
  | "orange"
  | "slate";

type Shades = Record<"50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900", string>;

interface ThemeDefinition {
  name: string;
  swatchHex: string; // pour le picker UI
  shades: Shades;
}

export const themes: Record<ThemeName, ThemeDefinition> = {
  violet: {
    name: "Violet",
    swatchHex: "#7c3aed",
    shades: {
      50: "245 243 255",
      100: "237 233 254",
      200: "221 214 254",
      300: "196 181 253",
      400: "167 139 250",
      500: "139 92 246",
      600: "124 58 237",
      700: "109 40 217",
      800: "91 33 182",
      900: "76 29 149",
    },
  },
  indigo: {
    name: "Indigo",
    swatchHex: "#4f46e5",
    shades: {
      50: "238 242 255",
      100: "224 231 255",
      200: "199 210 254",
      300: "165 180 252",
      400: "129 140 248",
      500: "99 102 241",
      600: "79 70 229",
      700: "67 56 202",
      800: "55 48 163",
      900: "49 46 129",
    },
  },
  blue: {
    name: "Bleu",
    swatchHex: "#2563eb",
    shades: {
      50: "239 246 255",
      100: "219 234 254",
      200: "191 219 254",
      300: "147 197 253",
      400: "96 165 250",
      500: "59 130 246",
      600: "37 99 235",
      700: "29 78 216",
      800: "30 64 175",
      900: "30 58 138",
    },
  },
  emerald: {
    name: "Émeraude",
    swatchHex: "#059669",
    shades: {
      50: "236 253 245",
      100: "209 250 229",
      200: "167 243 208",
      300: "110 231 183",
      400: "52 211 153",
      500: "16 185 129",
      600: "5 150 105",
      700: "4 120 87",
      800: "6 95 70",
      900: "6 78 59",
    },
  },
  rose: {
    name: "Rose",
    swatchHex: "#e11d48",
    shades: {
      50: "255 241 242",
      100: "255 228 230",
      200: "254 205 211",
      300: "253 164 175",
      400: "251 113 133",
      500: "244 63 94",
      600: "225 29 72",
      700: "190 18 60",
      800: "159 18 57",
      900: "136 19 55",
    },
  },
  orange: {
    name: "Orange",
    swatchHex: "#ea580c",
    shades: {
      50: "255 247 237",
      100: "255 237 213",
      200: "254 215 170",
      300: "253 186 116",
      400: "251 146 60",
      500: "249 115 22",
      600: "234 88 12",
      700: "194 65 12",
      800: "154 52 18",
      900: "124 45 18",
    },
  },
  slate: {
    name: "Ardoise",
    swatchHex: "#475569",
    shades: {
      50: "248 250 252",
      100: "241 245 249",
      200: "226 232 240",
      300: "203 213 225",
      400: "148 163 184",
      500: "100 116 139",
      600: "71 85 105",
      700: "51 65 85",
      800: "30 41 59",
      900: "15 23 42",
    },
  },
};

export const DEFAULT_THEME: ThemeName = "violet";
export const THEME_STORAGE_KEY = "app-theme";
export const DARK_MODE_STORAGE_KEY = "app-dark-mode";

export type DarkMode = "light" | "dark" | "system";

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && value in themes;
}

export function isDarkMode(value: unknown): value is DarkMode {
  return value === "light" || value === "dark" || value === "system";
}
