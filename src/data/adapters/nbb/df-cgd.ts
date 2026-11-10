import { NbbDatasetAdapter, type NbbDatasetConfig, type NbbMetricMapping } from "./dataset-adapter";

/**
 * DF_CGD — Consolidated gross debt of general government (Maastricht-style).
 * Confirmed live dimensions/codes: docs/NBB_DATA_DISCOVERY.md.
 *
 * The DSD's own `CL_CGD_ITEM` codelist documents a `CONTRIB`/`CONTRIB_S13xx`
 * family of codes literally named "p.m. Contribution of the subsector to
 * the total consolidated gross debt" — but every dimension-key combination
 * using those codes returns NBB HTTP 404 (no data published under them).
 * The only populated item is `ITEM=CGD`, queried per `GSECTOR`: `S1300`
 * (general government, consolidated — the whole-of-government total) and
 * `S1311`/`S1312`/`S1313`/`S1314` (the four ESA subsectors, each
 * individually consolidated). `INSTRUMENT=F` selects the all-instruments
 * aggregate. This is therefore the working data source for "contribution
 * to total consolidated gross debt": each subsector's own consolidated
 * CGD figure, read alongside the S1300 total — not a literal `CONTRIB`
 * series.
 *
 * `S1300`'s figure is the same concept as Eurostat's quarterly Maastricht
 * debt (`gov_10q_ggdebt`, metric `government_debt`) — mapped to that same
 * canonical metric so the two sources can be reconciled directly (see
 * src/data/derivations/nbb-eurostat-debt-reconciliation.ts). S1311-S1314
 * are mapped to the distinct `subsectorDebtContribution` metric instead:
 * live data shows S1311+S1312+S1313+S1314 does NOT sum to S1300 (e.g.
 * 2026-Q1: sum=730,019 vs S1300=706,581, a ~23.4bn EUR gap consistent with
 * intersectoral debt holdings/consolidating elements), so subsector
 * figures must never be presented as if they partition the total.
 */
const CGD_ITEM_CODE = "CGD";

export const DF_CGD_METRIC_MAPPINGS: NbbMetricMapping[] = [
  { itemCode: CGD_ITEM_CODE, metricCode: "government_debt", entityCode: "S1300" },
  { itemCode: CGD_ITEM_CODE, metricCode: "subsectorDebtContribution" },
];

/**
 * Explicit import scope: quarterly, EUR millions, S1300 + the four ESA
 * subsectors, all-instruments aggregate only. Confirmed live coverage is
 * 1998-Q4 through at least 2026-Q1 for every one of these sectors (110
 * observations each) — not assumed from DF_NFGOV_DISS's 1995-2025 annual
 * range, which is a different dataflow with different coverage.
 */
export const DF_CGD_CONFIG: NbbDatasetConfig = {
  datasetCode: "DF_CGD",
  datasetTitle: "Consolidated gross debt of general government",
  dataflow: "DF_CGD",
  dataflowVersion: "1.0",
  entityDimension: "GSECTOR",
  metricDimension: "ITEM",
  frequencyDimension: "FREQ",
  frequencyCode: "Q",
  entityCodes: ["S1300", "S1311", "S1312", "S1313", "S1314"],
  additionalKeyDimensions: { INSTRUMENT: ["F"] },
  expectedUnitMultiplier: 6,
  impliedUnitCode: "EUR_MILLION",
  metricMappings: DF_CGD_METRIC_MAPPINGS,
  entityIdentifierScheme: "NBB_SECTOR",
};

export function createDfCgdAdapter(): NbbDatasetAdapter {
  return new NbbDatasetAdapter(DF_CGD_CONFIG);
}
