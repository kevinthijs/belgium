import type { DataFrequency, ImportRunStatus } from "@/generated/prisma";

export type HealthState = "HEALTHY" | "WARNING" | "STALE" | "FAILED" | "NEVER_IMPORTED";

export interface StalenessResult {
  frequency: DataFrequency;
  isStale: boolean;
  isWarning: boolean;
  daysSinceSuccess: number | null;
  staleAfterDays: number | null;
  warningAfterDays: number | null;
}

/**
 * Staleness windows are derived from the dataset's own publication cadence,
 * never a single global "older than N hours" rule — a quarterly Eurostat
 * series and a daily import-check cycle are different concepts. IRREGULAR
 * datasets are never marked stale purely by elapsed time (only by "never
 * imported" / "last attempt failed", handled separately in
 * `getDatasetHealth`).
 *
 * Windows include deliberate grace periods for real-world publication lag
 * (Eurostat quarterly debt data is typically published ~3 months after
 * quarter-end; annual accounts can lag well over a year for the final
 * vintage).
 */
const STALE_AFTER_DAYS: Partial<Record<DataFrequency, number>> = {
  MONTHLY: 45,
  QUARTERLY: 120,
  ANNUAL: 400,
};

export function computeStaleness(
  frequency: DataFrequency,
  lastSuccessfulImportAt: Date | null,
  now: Date = new Date(),
): StalenessResult {
  const staleAfterDays = STALE_AFTER_DAYS[frequency] ?? null;
  if (staleAfterDays === null || !lastSuccessfulImportAt) {
    return { frequency, isStale: false, isWarning: false, daysSinceSuccess: null, staleAfterDays: null, warningAfterDays: null };
  }

  const daysSinceSuccess = Math.floor((now.getTime() - lastSuccessfulImportAt.getTime()) / (1000 * 60 * 60 * 24));
  const warningAfterDays = Math.round(staleAfterDays * 0.75);

  return {
    frequency,
    isStale: daysSinceSuccess > staleAfterDays,
    isWarning: daysSinceSuccess > warningAfterDays && daysSinceSuccess <= staleAfterDays,
    daysSinceSuccess,
    staleAfterDays,
    warningAfterDays,
  };
}

export interface DatasetHealthInput {
  isEnabled: boolean;
  frequency: DataFrequency;
  lastCheckedAt: Date | null;
  lastImportRun: { status: ImportRunStatus; startedAt: Date; completedAt: Date | null } | null;
  lastSuccessfulImportAt: Date | null;
  latestRunRejectedCount: number;
  /** Open unmapped values since the last success that are NOT routine
   * (severity above INFO) — expected-unsupported/historical values should
   * never push a dataset out of HEALTHY on their own. */
  unmappedSinceLastSuccessCount: number;
  now?: Date;
}

export interface DatasetHealthResult {
  state: HealthState;
  reasons: string[];
  staleness: StalenessResult;
}

/**
 * Single source of truth for a dataset's health badge. Never hardcode a
 * health verdict or a raw date comparison directly in a UI component —
 * everything renders through this function so the rules stay in one place
 * and are unit-testable without a database.
 */
export function getDatasetHealth(input: DatasetHealthInput): DatasetHealthResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  const staleness = computeStaleness(input.frequency, input.lastSuccessfulImportAt, now);

  if (!input.lastSuccessfulImportAt) {
    reasons.push("Nog nooit succesvol geïmporteerd.");
    return { state: "NEVER_IMPORTED", reasons, staleness };
  }

  if (input.lastImportRun && input.lastImportRun.status === "FAILED") {
    reasons.push("Laatste importpoging is mislukt.");
    return { state: "FAILED", reasons, staleness };
  }

  if (staleness.isStale) {
    reasons.push(
      `Laatste succesvolle import is ${staleness.daysSinceSuccess} dagen oud (verwacht binnen ${staleness.staleAfterDays} dagen voor een ${frequencyLabel(input.frequency)} dataset).`,
    );
    return { state: "STALE", reasons, staleness };
  }

  if (!input.isEnabled) {
    reasons.push("Dataset is uitgeschakeld (isEnabled = false).");
  }
  if (staleness.isWarning) {
    reasons.push(
      `Laatste succesvolle import is ${staleness.daysSinceSuccess} dagen oud — nadert de verwachte update-termijn van ${staleness.staleAfterDays} dagen.`,
    );
  }
  if (input.latestRunRejectedCount > 0) {
    reasons.push(`Laatste importrun had ${input.latestRunRejectedCount} afgewezen record(s).`);
  }
  if (input.unmappedSinceLastSuccessCount > 0) {
    reasons.push(
      `${input.unmappedSinceLastSuccessCount} onverwachte ongemapte waarde(n) sinds de laatste succesvolle import (routinematig verwachte/historische waarden tellen hier niet mee).`,
    );
  }
  if (input.lastImportRun && input.lastImportRun.status === "PARTIAL_SUCCESS") {
    reasons.push("Laatste importrun was slechts gedeeltelijk geslaagd.");
  }

  if (reasons.length > 0) {
    return { state: "WARNING", reasons, staleness };
  }

  return { state: "HEALTHY", reasons: [], staleness };
}

function frequencyLabel(frequency: DataFrequency): string {
  switch (frequency) {
    case "MONTHLY":
      return "maandelijkse";
    case "QUARTERLY":
      return "kwartaal-";
    case "ANNUAL":
      return "jaarlijkse";
    case "IRREGULAR":
      return "onregelmatige";
  }
}
