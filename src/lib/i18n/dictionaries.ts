import fr from "./fr";
import en from "./en";
import type { Dictionary } from "./fr";
import type { Locale } from "./types";

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
