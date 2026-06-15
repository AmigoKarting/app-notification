export type { Dictionary } from "./fr";
export type { Locale, DateFormat } from "./types";
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, DATE_FORMAT_COOKIE, DEFAULT_DATE_FORMAT } from "./types";
export { getDictionary } from "./dictionaries";
// Server-only exports (getLocale, getServerDictionary, getDateFormat) must be imported
// directly from "@/lib/i18n/server" to avoid bundling next/headers in client code.
export { LocaleProvider, useTranslation } from "./context";
