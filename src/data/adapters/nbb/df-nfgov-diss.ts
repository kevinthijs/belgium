import { NbbDatasetAdapter, type NbbDatasetConfig, type NbbMetricMapping } from "./dataset-adapter";

/**
 * DF_NFGOV_DISS — Non-financial account of the government (overview).
 * Confirmed live dimensions/codes: docs/NBB_DATA_DISCOVERY.md §3.
 *
 * Every mapping below was verified against the live DF_NFGOV_DISS DSD/data
 * (english names actually returned for GOVTYPE=S1300 rows), never from a
 * human-readable label alone. `esaTransactionCode` is general ESA 2010
 * textbook knowledge documented as provenance, not an NBB-supplied
 * annotation — see docs/NBB_IMPORT.md. Codes present in the shared
 * CL_NACC_ITEM_DISS codelist without a confirmed live description (e.g.
 * CAO, CSG, CTE, CUO, KEX, KTX, OPI, PDF, the 1Cx/1Ix/1Ox/1SB family) are
 * deliberately left unmapped this sprint rather than guessed.
 */
export const DF_NFGOV_DISS_METRIC_MAPPINGS: NbbMetricMapping[] = [
  { itemCode: "TOR", metricCode: "government_revenue" },
  { itemCode: "TOE", metricCode: "government_expenditure" },
  { itemCode: "DEF", metricCode: "net_lending_borrowing", esaTransactionCode: "B.9" },
  { itemCode: "COE", metricCode: "compensation_of_employees", esaTransactionCode: "D.1" },
  { itemCode: "INT_C", metricCode: "interest_expenditure", esaTransactionCode: "D.41" },
  { itemCode: "INT_R", metricCode: "interest_received", esaTransactionCode: "D.41" },
  { itemCode: "ITX", metricCode: "taxes_production_imports", esaTransactionCode: "D.2" },
  { itemCode: "DTX", metricCode: "taxes_income", esaTransactionCode: "D.5" },
  { itemCode: "SCA", metricCode: "social_contributions", esaTransactionCode: "D.61" },
  { itemCode: "SCI", metricCode: "imputed_social_contributions", esaTransactionCode: "D.612" },
  { itemCode: "INV", metricCode: "gross_fixed_capital_formation", esaTransactionCode: "P.51g" },
  { itemCode: "GSV", metricCode: "gross_saving", esaTransactionCode: "B.8g" },
];

/**
 * Explicit import scope (Phase 11): only Belgium's general government
 * total plus its four ESA subsectors, in EUR millions. `% of GDP` (UNIT=P)
 * is deliberately deferred — not requested this sprint.
 */
export const DF_NFGOV_DISS_CONFIG: NbbDatasetConfig = {
  datasetCode: "DF_NFGOV_DISS",
  datasetTitle: "Non-financial account of the government – overview",
  dataflow: "DF_NFGOV_DISS",
  dataflowVersion: "1.0",
  entityDimension: "GOVTYPE",
  metricDimension: "ITEM",
  unitDimension: "UNIT",
  frequencyDimension: "FREQ",
  frequencyCode: "A",
  entityCodes: ["S1300", "S1311", "S1312", "S1313", "S1314"],
  unitCodes: ["E"],
  expectedUnitMultiplier: 6,
  metricMappings: DF_NFGOV_DISS_METRIC_MAPPINGS,
  entityIdentifierScheme: "NBB_SECTOR",
};

export function createDfNfgovDissAdapter(): NbbDatasetAdapter {
  return new NbbDatasetAdapter(DF_NFGOV_DISS_CONFIG);
}
