export const SUPPORTED_LOCALES = ["es", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function normalizeLocale(value: unknown): Locale {
  return value === "es" || value === "en" ? value : DEFAULT_LOCALE;
}

export function getAvailableLocales(
  translations: Partial<Record<Locale, unknown>>
): Locale[] {
  return SUPPORTED_LOCALES.filter((locale) => Boolean(translations[locale]));
}
