export const locales = ["nl", "fr", "de", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";

export const localeLabels: Record<Locale, string> = {
  nl: "Nederlands",
  fr: "Français",
  de: "Deutsch",
  en: "English",
};

/** Locales with a complete UI translation today. Others fall back to `defaultLocale`. */
export const enabledLocales: Locale[] = ["nl"];
