import { cookies } from "next/headers";
import type { Locale } from "./types";
import { DEFAULT_LOCALE, LOCALE_COOKIE } from "./types";
import { getDictionary } from "./dictionaries";

export function getLocale(): Locale {
  const val = cookies().get(LOCALE_COOKIE)?.value;
  return val === "en" ? "en" : DEFAULT_LOCALE;
}

export function getServerDictionary() {
  return getDictionary(getLocale());
}

export { getDictionary };
