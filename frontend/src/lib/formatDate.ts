import type { Locale } from "./i18n";
import { copy } from "./i18n";

export function formatDate(
  value: string | null | undefined,
  locale: Locale = "en"
): string {
  if (!value) {
    return copy[locale].states.undated;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function compareProjectsByDate(
  first: { date: string | null; updatedAt?: string },
  second: { date: string | null; updatedAt?: string }
): number {
  const firstValue = Date.parse(first.date ?? first.updatedAt ?? "");
  const secondValue = Date.parse(second.date ?? second.updatedAt ?? "");

  if (Number.isNaN(firstValue) && Number.isNaN(secondValue)) {
    return 0;
  }

  if (Number.isNaN(firstValue)) {
    return 1;
  }

  if (Number.isNaN(secondValue)) {
    return -1;
  }

  return secondValue - firstValue;
}
