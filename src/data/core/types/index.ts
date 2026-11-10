import type Decimal from "decimal.js";

/**
 * Shared contracts for the data-source adapter layer. Adapters translate a
 * specific external API (Eurostat, NBB.Stat, Statbel, ...) into these
 * neutral shapes; nothing downstream of `normalize()` should need to know
 * about source-specific dimension codes.
 */

export interface DatasetMetadata {
  datasetCode: string;
  title: string;
  lastUpdated?: Date;
  lastStructuralChange?: Date;
  source: string;
}

export interface ImportState {
  datasetCode: string;
  lastImportedVersion?: string;
  lastImportedChecksum?: string;
  lastImportedAt?: Date;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  remoteVersion?: string;
  remoteChecksum?: string;
  remoteLastModified?: Date;
  reason: string;
}

export interface FetchOptions {
  /** Source-native filter values, e.g. Eurostat dimension filters. */
  filters?: Record<string, string[]>;
  since?: Date;
}

export interface RawDataset {
  datasetCode: string;
  format: "JSON_STAT" | "SDMX" | "CSV" | "JSON" | "XLSX";
  retrievedAt: Date;
  checksum: string;
  payload: unknown;
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * A fully normalized observation, still referencing *source-native* codes
 * for entity/metric/unit/classification. Mapping these codes onto our
 * canonical registry rows happens in a separate step (see
 * src/data/mappings), so raw dimension values are never silently discarded
 * — unmapped codes are recorded instead of dropped.
 */
export interface NormalizedObservation {
  sourceEntityCode: string;
  sourceMetricCode: string;
  periodLabel: string;
  periodType: "YEAR" | "QUARTER" | "MONTH" | "DATE";
  year: number;
  quarter?: number;
  month?: number;
  /**
   * Exact date a DATE-period observation refers to (e.g. Statbel's legal
   * population, always "op 1 januari"). Required when periodType is
   * "DATE" — keeps a point-in-time stock measurement from being silently
   * reinterpreted as an annual average.
   */
  referenceDate?: Date;
  value: Decimal;
  sourceUnitCode: string;
  status: ObservationStatusCode;
  /** e.g. "COFOG" — required together with sourceClassificationCode. */
  sourceClassificationSystem?: string;
  sourceClassificationCode?: string;
  sourceDimensions?: Record<string, string>;
  publishedAt?: Date;
}

export type ObservationStatusCode =
  | "BUDGET"
  | "ADJUSTED_BUDGET"
  | "PROVISIONAL"
  | "FINAL"
  | "ESTIMATE"
  | "FORECAST";

export interface DataSourceAdapter {
  readonly datasetCode: string;
  getMetadata(): Promise<DatasetMetadata>;
  checkForUpdate(state: ImportState): Promise<UpdateCheckResult>;
  fetch(options?: FetchOptions): Promise<RawDataset>;
  validate(raw: RawDataset): Promise<ValidationResult>;
  normalize(raw: RawDataset): Promise<NormalizedObservation[]>;
}
