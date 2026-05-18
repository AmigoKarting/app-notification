export type { Dictionary } from "./fr";
export type { Locale } from "./types";
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "./types";
export { getDictionary } from "./dictionaries";
// Server-only exports (getLocale, getServerDictionary) must be imported
// directly from "@/lib/i18n/server" to avoid bundling next/headers in client code.
export { LocaleProvider, useTranslation } from "./context";
