import type { ObservationStatusCode } from "@/data/core/types";

/**
 * Eurostat "OBS_FLAG" / status codes -> our neutral status vocabulary.
 * See https://ec.europa.eu/eurostat/data/database/information (flags legend).
 * Unrecognised flags fall back to "FINAL" but are logged by the caller via
 * the returned `recognised` flag so unmapped codes stay visible instead of
 * silently defaulting.
 */
const EUROSTAT_FLAG_TO_STATUS: Record<string, ObservationStatusCode> = {
  p: "PROVISIONAL",
  e: "ESTIMATE",
  f: "FORECAST",
  b: "PROVISIONAL", // break in time series, value itself still provisional/final depending on context
  d: "FINAL", // definition differs
  n: "FINAL", // not significant
};

export function mapEurostatStatusFlag(flag: string | undefined): {
  status: ObservationStatusCode;
  recognised: boolean;
} {
  if (!flag) return { status: "FINAL", recognised: true };
  const normalized = flag.trim().toLowerCase();
  const mapped = EUROSTAT_FLAG_TO_STATUS[normalized];
  if (mapped) return { status: mapped, recognised: true };
  return { status: "FINAL", recognised: false };
}

/** Eurostat `time` dimension codes: "2026", "2026-Q1", "2026-01". */
export function parseEurostatPeriod(code: string): {
  periodType: "YEAR" | "QUARTER" | "MONTH";
  year: number;
  quarter?: number;
  month?: number;
  label: string;
} {
  const quarterMatch = /^(\d{4})-Q(\d)$/.exec(code);
  if (quarterMatch) {
    return {
      periodType: "QUARTER",
      year: Number(quarterMatch[1]),
      quarter: Number(quarterMatch[2]),
      label: code,
    };
  }
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(code);
  if (monthMatch) {
    return {
      periodType: "MONTH",
      year: Number(monthMatch[1]),
      month: Number(monthMatch[2]),
      label: code,
    };
  }
  const yearMatch = /^(\d{4})$/.exec(code);
  if (yearMatch) {
    return { periodType: "YEAR", year: Number(yearMatch[1]), label: code };
  }
  throw new Error(`Unrecognised Eurostat period code: "${code}"`);
}
