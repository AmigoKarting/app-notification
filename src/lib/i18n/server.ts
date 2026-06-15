import { cookies } from "next/headers";
import type { Locale, DateFormat } from "./types";
import { DEFAULT_LOCALE, LOCALE_COOKIE, DATE_FORMAT_COOKIE, DEFAULT_DATE_FORMAT } from "./types";
import { getDictionary } from "./dictionaries";

export function getLocale(): Locale {
  const val = cookies().get(LOCALE_COOKIE)?.value;
  return val === "en" ? "en" : DEFAULT_LOCALE;
}

export function getDateFormat(): DateFormat {
  const val = cookies().get(DATE_FORMAT_COOKIE)?.value;
  return val === "friendly" ? "friendly" : DEFAULT_DATE_FORMAT;
}

export function getServerDictionary() {
  return getDictionary(getLocale());
}

export { getDictionary };
