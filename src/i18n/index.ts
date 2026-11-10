import { type Locale, defaultLocale, enabledLocales } from "./config";
import nl from "./messages/nl";
import fr from "./messages/fr";
import de from "./messages/de";
import en from "./messages/en";
import type { Messages } from "./messages/nl";

const dictionaries: Record<Locale, Messages> = { nl, fr, de, en };

/** Falls back to `defaultLocale` for locales not yet enabled in the UI. */
export function getMessages(locale: Locale = defaultLocale): Messages {
  const resolved = enabledLocales.includes(locale) ? locale : defaultLocale;
  return dictionaries[resolved];
}

export * from "./config";
export type { Messages };
