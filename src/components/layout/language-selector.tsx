"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { locales, localeLabels, enabledLocales, defaultLocale } from "@/i18n/config";

/**
 * UI/architecture is in place for nl/fr/de/en (see src/i18n); only `nl` has
 * a complete translation today, so other locales are shown but disabled
 * rather than silently switching to half-translated copy.
 */
export function LanguageSelector() {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Taal kiezen, Nederlands"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-border px-3 py-2 text-xs font-medium text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
        >
          {defaultLocale.toUpperCase()}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} align="end" className="z-50 w-40 rounded-md border border-border bg-surface p-1 text-sm shadow-lg">
          {locales.map((locale) => {
            const enabled = enabledLocales.includes(locale);
            return (
              <button
                key={locale}
                type="button"
                disabled={!enabled}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-foreground-muted transition enabled:hover:bg-surface-muted enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {localeLabels[locale]}
                {!enabled ? <span className="text-[10px]">binnenkort</span> : null}
              </button>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
