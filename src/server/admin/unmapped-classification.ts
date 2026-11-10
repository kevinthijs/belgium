/**
 * Turns a raw unmapped dimension value into a category + severity, so the
 * backlog can be triaged without eyeballing every row. Pure and
 * database-free: given the same inputs it always returns the same verdict,
 * which is what makes it unit-testable and safe to reuse both at import
 * time (`import-runner.ts`) and for one-off backfills of pre-existing rows.
 *
 * Deliberately conservative: anything that doesn't match a known pattern
 * falls through to UNEXPECTED/WARNING rather than being guessed at. Only
 * `dimension: "entity"` has dataset-specific rules today, because that's
 * where the entire current backlog lives (see docs/ADMIN_DATA.md).
 */

export type UnmappedCategory =
  | "UNEXPECTED"
  | "EXPECTED_UNSUPPORTED"
  | "HISTORICAL_ENTITY"
  | "MISSING_CANONICAL_ENTITY"
  | "MISSING_CLASSIFICATION"
  | "MISSING_METRIC_MAPPING"
  | "MISSING_UNIT_MAPPING"
  | "INVALID_SOURCE_VALUE"
  | "SOURCE_SCHEMA_CHANGE"
  | "OTHER";

export type UnmappedSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface ClassifyUnmappedInput {
  datasetCode: string;
  dimension: string;
  rawValue: string;
  /** `NormalizedObservation.sourceDimensions`, when the adapter recorded one. */
  sourceDimensions?: Record<string, unknown> | null;
}

export interface UnmappedClassification {
  category: UnmappedCategory;
  severity: UnmappedSeverity;
  reason: string;
}

/** Eurostat geo/aggregate codes the app deliberately does not track as
 * entities (every EU/EEA country and euro-area aggregate other than the
 * ones the homepage's international comparison needs). Not exhaustive by
 * design — anything not on the "needed" list from gov_10q_ggdebt's geo
 * dimension is presumed to be exactly this. */
const EUROSTAT_COUNTRY_OR_AGGREGATE = /^([A-Z]{2}|EA\d{2}|EU\d{2}(_\d{4})?)$/;

/** Statbel NIS codes ending in "000" are always aggregate rows (country,
 * region, province or arrondissement), never a real municipality — this is
 * a structural fact of the NIS coding scheme, not inferred from a label. */
const STATBEL_AGGREGATE_NIS = /000$/;

const SEVERITY_BY_CATEGORY: Record<UnmappedCategory, UnmappedSeverity> = {
  UNEXPECTED: "WARNING",
  EXPECTED_UNSUPPORTED: "INFO",
  HISTORICAL_ENTITY: "INFO",
  MISSING_CANONICAL_ENTITY: "WARNING",
  MISSING_CLASSIFICATION: "WARNING",
  MISSING_METRIC_MAPPING: "WARNING",
  MISSING_UNIT_MAPPING: "WARNING",
  INVALID_SOURCE_VALUE: "WARNING",
  SOURCE_SCHEMA_CHANGE: "CRITICAL",
  OTHER: "WARNING",
};

function classified(category: UnmappedCategory, reason: string): UnmappedClassification {
  return { category, severity: SEVERITY_BY_CATEGORY[category], reason };
}

export function classifyUnmapped(input: ClassifyUnmappedInput): UnmappedClassification {
  const { datasetCode, dimension, rawValue } = input;

  if (dimension === "metric") {
    return classified("MISSING_METRIC_MAPPING", "Source metric code has no mapping yet");
  }
  if (dimension === "unit") {
    return classified("MISSING_UNIT_MAPPING", "Source unit code has no mapping yet");
  }
  if (dimension === "classification") {
    return classified("MISSING_CLASSIFICATION", "Source classification code has no mapping yet");
  }

  if (dimension === "entity") {
    if (datasetCode === "gov_10q_ggdebt" || datasetCode === "gov_10a_main" || datasetCode === "gov_10a_exp" || datasetCode === "gov_10a_taxag") {
      if (rawValue !== "BE" && EUROSTAT_COUNTRY_OR_AGGREGATE.test(rawValue)) {
        return classified(
          "EXPECTED_UNSUPPORTED",
          "Eurostat sends all EU/EEA geographies; only Belgium and the homepage's comparison countries are tracked as entities",
        );
      }
    }

    if (datasetCode === "statbel_population_per_municipality") {
      const kind = input.sourceDimensions?.kind;
      if (STATBEL_AGGREGATE_NIS.test(rawValue)) {
        if (kind === "OTHER_AGGREGATE" || kind === undefined) {
          return classified(
            "EXPECTED_UNSUPPORTED",
            "Statbel NIS code ending in 000 is a province/arrondissement aggregate row, not a real municipality",
          );
        }
      }
      // A 5-digit NIS code not ending in 000 that doesn't resolve to a
      // current municipality is presumed to be a pre-merger municipality
      // still present in Statbel's historical series (data goes back to
      // 1992), not a genuine mapping gap.
      return classified(
        "HISTORICAL_ENTITY",
        "NIS code does not match any current municipality; presumed pre-merger/defunct",
      );
    }

    return classified("MISSING_CANONICAL_ENTITY", "No entity found for this source code");
  }

  return classified("UNEXPECTED", "No classification rule matched this dimension");
}
