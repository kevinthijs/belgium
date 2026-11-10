import type {
  DataSourceAdapter,
  DatasetMetadata,
  FetchOptions,
  ImportState,
  NormalizedObservation,
  RawDataset,
  UpdateCheckResult,
  ValidationResult,
} from "@/data/core/types";
import { NbbSdmxClient, NbbSdmxError } from "./client";
import { NbbCsvParser } from "./csv-parser";
import { mapNbbObsStatus, parseNbbAnnualPeriod, parseNbbQuarterPeriod } from "./status-mapper";

/** One raw NBB transaction/item code mapped onto a canonical `Metric.code`.
 * `esaTransactionCode` is informational provenance only (see
 * docs/NBB_IMPORT.md) — the raw NBB code is what's actually preserved in
 * `sourceDimensions`, never the ESA code alone. Never populate this from a
 * human-readable label; only from a verified codelist/live-data check.
 *
 * `entityCode`, when set, restricts this mapping to rows for that entity
 * only — needed when the same source item code means a genuinely
 * different canonical concept depending on which entity reports it (e.g.
 * DF_CGD's `ITEM=CGD` is "government_debt" for the whole-government total
 * S1300 but "subsectorDebtContribution" for S1311-S1314). A mapping
 * without `entityCode` is the default, used when no entity-specific
 * mapping matches. */
export interface NbbMetricMapping {
  itemCode: string;
  metricCode: string;
  esaTransactionCode?: string;
  entityCode?: string;
}

/**
 * Configuration for one NBB dataflow. `NbbDatasetAdapter` is generic over
 * this — a new NBB dataflow should normally only require a new config
 * object, not a new adapter class (Phase 4 instruction).
 */
export interface NbbDatasetConfig {
  datasetCode: string;
  datasetTitle: string;
  dataflow: string;
  dataflowVersion: string;
  /** Dimension id holding the entity/sector code, e.g. "GOVTYPE". */
  entityDimension: string;
  /** Dimension id holding the transaction/item code, e.g. "ITEM". */
  metricDimension: string;
  /** Dimension id holding the unit code, e.g. "UNIT". Omit for dataflows
   * with no separate unit dimension (unit is then conveyed only via the
   * UNIT_MULT CSV attribute, scaled per `expectedUnitMultiplier`). */
  unitDimension?: string;
  /** Dimension id holding the frequency code, e.g. "FREQ". */
  frequencyDimension: string;
  frequencyCode: string;
  /** Explicit import scope — only these entity codes are ever requested. */
  entityCodes: string[];
  /** Explicit import scope — only these unit codes are ever requested.
   * Required when `unitDimension` is set. */
  unitCodes?: string[];
  /** Additional structural dimensions to constrain the query key beyond
   * entity/metric/unit/frequency (e.g. `{ INSTRUMENT: ["F"] }` for
   * DF_CGD's "all instruments" aggregate). Values are also preserved
   * verbatim in `sourceDimensions` since the CSV parser is
   * dimension-agnostic. */
  additionalKeyDimensions?: Record<string, string[]>;
  /** Power-of-ten scale the platform expects monetary values in (e.g. 6
   * for EUR millions), applied via `UNIT_MULT`-aware rescaling regardless
   * of whether a unit dimension exists. */
  expectedUnitMultiplier: number;
  /** Unit code to record when there is no `unitDimension` (unit is
   * implied for the whole dataflow, e.g. "EUR_MILLION" for DF_CGD). */
  impliedUnitCode?: string;
  metricMappings: NbbMetricMapping[];
  /** ExternalEntityIdentifier scheme used to resolve entity codes, e.g. "NBB_SECTOR". */
  entityIdentifierScheme: string;
}

export class NbbDatasetAdapter implements DataSourceAdapter {
  readonly datasetCode: string;
  private readonly client: NbbSdmxClient;
  private readonly csvParser: NbbCsvParser;
  private readonly config: NbbDatasetConfig;
  private readonly itemCodes: string[];

  constructor(config: NbbDatasetConfig, client: NbbSdmxClient = new NbbSdmxClient(), csvParser: NbbCsvParser = new NbbCsvParser()) {
    this.config = config;
    this.datasetCode = config.datasetCode;
    this.client = client;
    this.csvParser = csvParser;
    this.itemCodes = [...new Set(config.metricMappings.map((m) => m.itemCode))];
  }

  /** Resolves the canonical metric code for a row, preferring a mapping
   * scoped to the row's entity over the dataflow-wide default. */
  private resolveMetricCode(itemCode: string, entityCode: string): string | undefined {
    const specific = this.config.metricMappings.find((m) => m.itemCode === itemCode && m.entityCode === entityCode);
    if (specific) return specific.metricCode;
    const general = this.config.metricMappings.find((m) => m.itemCode === itemCode && !m.entityCode);
    return general?.metricCode;
  }

  async getMetadata(): Promise<DatasetMetadata> {
    return {
      datasetCode: this.datasetCode,
      title: this.config.datasetTitle,
      source: "National Bank of Belgium (NBB.Stat)",
    };
  }

  async checkForUpdate(state: ImportState): Promise<UpdateCheckResult> {
    const { checksum } = await this.fetchCsv(undefined);
    const hasUpdate = state.lastImportedChecksum !== checksum;
    return {
      hasUpdate,
      remoteChecksum: checksum,
      reason: hasUpdate ? "Remote CSV checksum differs from last import" : "No change since last import",
    };
  }

  async fetch(options?: FetchOptions): Promise<RawDataset> {
    const { text, checksum, retrievedAt } = await this.fetchCsv(options?.since);
    return { datasetCode: this.datasetCode, format: "CSV", retrievedAt, checksum, payload: text };
  }

  async validate(raw: RawDataset): Promise<ValidationResult> {
    const issues: ValidationResult["issues"] = [];
    if (raw.format !== "CSV") {
      issues.push({ path: "format", message: `Expected CSV, got ${raw.format}`, severity: "error" });
    }
    const text = raw.payload as string;
    const rows = this.csvParser.parse(text);
    for (const row of rows) {
      if (!row.dimensions[this.config.entityDimension]) {
        issues.push({ path: `dimensions.${this.config.entityDimension}`, message: "Missing entity dimension value", severity: "error" });
        break;
      }
    }
    return { valid: issues.every((i) => i.severity !== "error"), issues };
  }

  async normalize(raw: RawDataset): Promise<NormalizedObservation[]> {
    const text = raw.payload as string;
    const rows = this.csvParser.parse(text);
    const observations: NormalizedObservation[] = [];

    for (const row of rows) {
      const entityCode = row.dimensions[this.config.entityDimension];
      const itemCode = row.dimensions[this.config.metricDimension];
      const unitCode = this.config.unitDimension
        ? row.dimensions[this.config.unitDimension]
        : this.config.impliedUnitCode;
      if (!entityCode || !itemCode || !unitCode) continue;

      const metricCode = this.resolveMetricCode(itemCode, entityCode);
      if (!metricCode) continue; // not in scope for this import — never requested, so not "unmapped" noise

      const decimalValue = this.csvParser.toDecimalValue(row, this.config.expectedUnitMultiplier);
      if (decimalValue === null) continue; // confidential/missing cell — nothing to import

      const period = this.config.frequencyCode === "Q" ? parseNbbQuarterPeriod(row.timePeriod) : parseNbbAnnualPeriod(row.timePeriod);
      const { status } = mapNbbObsStatus(row.obsStatus);

      observations.push({
        sourceEntityCode: entityCode,
        sourceMetricCode: metricCode,
        periodLabel: period.label,
        periodType: period.periodType,
        year: period.year,
        quarter: "quarter" in period ? period.quarter : undefined,
        value: decimalValue,
        sourceUnitCode: unitCode,
        status,
        sourceDimensions: {
          ...row.dimensions,
          OBS_STATUS: row.obsStatus ?? "",
          CONF_STATUS: row.confStatus ?? "",
          rawItemCode: itemCode,
        },
      });
    }

    return observations;
  }

  private async fetchCsv(since: Date | undefined): Promise<{ text: string; checksum: string; retrievedAt: Date }> {
    // Dimension order is discovered live from the DSD rather than assumed,
    // since different NBB dataflows are not guaranteed to share ordering.
    const structure = await this.client.fetchStructure(this.config.dataflow);
    const dimensionOrder = [...structure.data.dataStructure.dimensions]
      .sort((a, b) => a.position - b.position)
      .map((d) => d.id);

    const key: Record<string, string[]> = {
      [this.config.frequencyDimension]: [this.config.frequencyCode],
      [this.config.entityDimension]: this.config.entityCodes,
      [this.config.metricDimension]: this.itemCodes,
      ...(this.config.unitDimension ? { [this.config.unitDimension]: this.config.unitCodes ?? [] } : {}),
      ...this.config.additionalKeyDimensions,
    };

    try {
      const result = await this.client.fetchDataCsv(this.config.dataflow, this.config.dataflowVersion, {
        key,
        dimensionOrder,
        since,
      });
      return { text: result.data, checksum: result.checksum, retrievedAt: result.retrievedAt };
    } catch (error) {
      // NBB returns a 404/NoRecordsFound-style error for an explicitly
      // scoped key with genuinely no data yet — surface as an empty CSV
      // rather than a hard failure, matching the "filtered, not rejected"
      // semantics used throughout the import pipeline.
      if (error instanceof NbbSdmxError && error.context.status === 404) {
        return { text: "", checksum: "empty", retrievedAt: new Date() };
      }
      throw error;
    }
  }
}
