import type { ObservationStatusCode } from "@/data/core/types";

/**
 * NBB `OBS_STATUS` codes (codelist `CL_OBS_STATUS`, shared SDMX/ECB status
 * set, 21 codes total — see docs/NBB_DATA_DISCOVERY.md §5) mapped to our
 * neutral status vocabulary. The raw code is always preserved by the
 * caller via `sourceDimensions`, never discarded. Absence of a status flag
 * is *not* assumed to mean FINAL by default — NBB's own confirmed sample
 * data always carried an explicit status (`A`, `P`, or `B`), so a missing
 * flag is treated as unrecognised rather than silently defaulted.
 */
const NBB_OBS_STATUS_TO_STATUS: Record<string, ObservationStatusCode> = {
  A: "FINAL", // Normal
  P: "PROVISIONAL",
  E: "ESTIMATE",
  B: "FINAL", // Time series break — the value itself is a real, final observation
  R: "FINAL", // Revised value — still a genuine (revised) final figure
  I: "ESTIMATE", // Value imputed
  D: "FINAL", // Definition differs — real value, comparability caveat only
  G: "ESTIMATE", // Experimental
};

export function mapNbbObsStatus(flag: string | undefined): {
  status: ObservationStatusCode;
  recognised: boolean;
} {
  if (!flag) return { status: "FINAL", recognised: false };
  const normalized = flag.trim().toUpperCase();
  const mapped = NBB_OBS_STATUS_TO_STATUS[normalized];
  if (mapped) return { status: mapped, recognised: true };
  return { status: "FINAL", recognised: false };
}

/** NBB annual `TIME_PERIOD` values are plain 4-digit years (e.g. "2023"). */
export function parseNbbAnnualPeriod(code: string): { periodType: "YEAR"; year: number; label: string } {
  const match = /^(\d{4})$/.exec(code.trim());
  if (!match) throw new Error(`Unrecognised NBB annual period code: "${code}"`);
  return { periodType: "YEAR", year: Number(match[1]), label: code.trim() };
}

/** NBB quarterly `TIME_PERIOD` values are "YYYY-Qn" (e.g. "1998-Q4"). */
export function parseNbbQuarterPeriod(code: string): { periodType: "QUARTER"; year: number; quarter: number; label: string } {
  const match = /^(\d{4})-Q([1-4])$/.exec(code.trim());
  if (!match) throw new Error(`Unrecognised NBB quarterly period code: "${code}"`);
  return { periodType: "QUARTER", year: Number(match[1]), quarter: Number(match[2]), label: code.trim() };
}
