import Decimal from "decimal.js";
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
import { EurostatClient } from "./eurostat-client";
import { parseJsonStatDataset, type JsonStatDataset } from "./json-stat-parser";
import { mapEurostatStatusFlag, parseEurostatPeriod } from "./dimension-mapper";

/**
 * Eurostat gov_10a_main — annual government revenue, expenditure and main
 * aggregates. Dimensions: freq, unit, sector, na_item, geo, time.
 *
 * We request both MIO_EUR and PC_GDP (Eurostat's own harmonised ratio, not
 * derived by us) for the na_item codes we map to canonical metrics below.
 * Any na_item present in the response that isn't in this map is logged via
 * UnmappedSourceValue by the import runner rather than silently dropped —
 * but since we only *request* the codes we map, that path mainly guards
 * against Eurostat changing na_item semantics under our feet.
 */
const NA_ITEM_TO_METRIC: Record<string, string> = {
  TR: "government_revenue",
  TE: "government_expenditure",
  B9: "net_lending_borrowing",
  D41PAY: "interest_expenditure",
};

const NA_ITEM_TO_PCT_GDP_METRIC: Record<string, string> = {
  TR: "government_revenue_pct_gdp",
  TE: "government_expenditure_pct_gdp",
  B9: "net_lending_borrowing_pct_gdp",
};

const REQUESTED_NA_ITEMS = ["TR", "TE", "B9", "D41PAY"];

export class GovTenAMainAdapter implements DataSourceAdapter {
  readonly datasetCode = "gov_10a_main";

  private readonly client: EurostatClient;

  constructor(client: EurostatClient = new EurostatClient()) {
    this.client = client;
  }

  async getMetadata(): Promise<DatasetMetadata> {
    return {
      datasetCode: this.datasetCode,
      title: "Government revenue, expenditure and main aggregates",
      source: "Eurostat",
    };
  }

  async checkForUpdate(state: ImportState): Promise<UpdateCheckResult> {
    const { checksum } = await this.client.fetchDataset(this.datasetCode, {
      filters: { unit: ["MIO_EUR", "PC_GDP"], sector: ["S13"], geo: ["BE"], na_item: REQUESTED_NA_ITEMS },
    });
    const hasUpdate = state.lastImportedChecksum !== checksum;
    return {
      hasUpdate,
      remoteChecksum: checksum,
      reason: hasUpdate ? "Remote payload checksum differs from last import" : "No change since last import",
    };
  }

  async fetch(options?: FetchOptions): Promise<RawDataset> {
    const { dataset, checksum, retrievedAt } = await this.client.fetchDataset(this.datasetCode, {
      filters: options?.filters ?? {
        unit: ["MIO_EUR", "PC_GDP"],
        sector: ["S13"],
        geo: ["BE"],
        na_item: REQUESTED_NA_ITEMS,
      },
      since: options?.since,
    });
    return { datasetCode: this.datasetCode, format: "JSON_STAT", retrievedAt, checksum, payload: dataset };
  }

  async validate(raw: RawDataset): Promise<ValidationResult> {
    const issues: ValidationResult["issues"] = [];
    if (raw.format !== "JSON_STAT") {
      issues.push({ path: "format", message: `Expected JSON_STAT, got ${raw.format}`, severity: "error" });
    }
    const dataset = raw.payload as JsonStatDataset;
    for (const required of ["geo", "time", "na_item", "unit"]) {
      if (!dataset.dimension?.[required]) {
        issues.push({ path: `dimension.${required}`, message: `Missing required dimension "${required}"`, severity: "error" });
      }
    }
    return { valid: issues.every((i) => i.severity !== "error"), issues };
  }

  async normalize(raw: RawDataset): Promise<NormalizedObservation[]> {
    const dataset = raw.payload as JsonStatDataset;
    const cells = parseJsonStatDataset(dataset);

    const observations: NormalizedObservation[] = [];

    for (const cell of cells) {
      const geo = cell.dimensions.geo;
      const time = cell.dimensions.time;
      const unit = cell.dimensions.unit;
      const naItem = cell.dimensions.na_item;
      if (!geo || !time || !unit || !naItem || cell.value === null) continue;

      const sourceMetricCode =
        unit === "PC_GDP" ? NA_ITEM_TO_PCT_GDP_METRIC[naItem] : NA_ITEM_TO_METRIC[naItem];
      // PC_GDP wasn't requested/mapped for D41PAY (interest) — skip rather
      // than log as unmapped, since it was never a code we asked for.
      if (!sourceMetricCode) continue;

      const period = parseEurostatPeriod(time);
      const { status } = mapEurostatStatusFlag(cell.status);

      observations.push({
        sourceEntityCode: geo,
        sourceMetricCode,
        periodLabel: period.label,
        periodType: period.periodType,
        year: period.year,
        value: new Decimal(cell.value),
        sourceUnitCode: unit,
        status,
        sourceDimensions: cell.dimensions,
        publishedAt: dataset.updated ? new Date(dataset.updated) : undefined,
      });
    }

    return observations;
  }
}
