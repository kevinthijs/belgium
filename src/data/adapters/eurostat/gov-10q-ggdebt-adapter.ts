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
 * Eurostat gov_10q_ggdebt — quarterly government (Maastricht) debt.
 * Dimensions: freq, unit, sector, na_item, geo, time.
 * We request both MIO_EUR (million euro) and PC_GDP (Eurostat's own
 * harmonised debt/GDP ratio — never derived by dividing our own EUR
 * figures by a separately-sourced GDP series), sector S13 (general
 * government), na_item GD (gross debt), all geo, all available quarters.
 */
export class GovTenQGgDebtAdapter implements DataSourceAdapter {
  readonly datasetCode = "gov_10q_ggdebt";

  private readonly client: EurostatClient;

  constructor(client: EurostatClient = new EurostatClient()) {
    this.client = client;
  }

  async getMetadata(): Promise<DatasetMetadata> {
    return {
      datasetCode: this.datasetCode,
      title: "Government consolidated gross debt (Maastricht debt), quarterly",
      source: "Eurostat",
    };
  }

  async checkForUpdate(state: ImportState): Promise<UpdateCheckResult> {
    const { checksum } = await this.client.fetchDataset(this.datasetCode, {
      filters: { unit: ["MIO_EUR", "PC_GDP"], sector: ["S13"], na_item: ["GD"] },
    });
    const hasUpdate = state.lastImportedChecksum !== checksum;
    return {
      hasUpdate,
      remoteChecksum: checksum,
      reason: hasUpdate
        ? "Remote payload checksum differs from last import"
        : "No change since last import",
    };
  }

  async fetch(options?: FetchOptions): Promise<RawDataset> {
    const { dataset, checksum, retrievedAt } = await this.client.fetchDataset(this.datasetCode, {
      filters: options?.filters ?? { unit: ["MIO_EUR", "PC_GDP"], sector: ["S13"], na_item: ["GD"] },
      since: options?.since,
    });
    return {
      datasetCode: this.datasetCode,
      format: "JSON_STAT",
      retrievedAt,
      checksum,
      payload: dataset,
    };
  }

  async validate(raw: RawDataset): Promise<ValidationResult> {
    const issues: ValidationResult["issues"] = [];
    if (raw.format !== "JSON_STAT") {
      issues.push({ path: "format", message: `Expected JSON_STAT, got ${raw.format}`, severity: "error" });
    }
    const dataset = raw.payload as JsonStatDataset;
    for (const required of ["geo", "time"]) {
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
      if (!geo || !time || cell.value === null) continue;

      const period = parseEurostatPeriod(time);
      const { status } = mapEurostatStatusFlag(cell.status);
      const sourceMetricCode = unit === "PC_GDP" ? "government_debt_pct_gdp" : "government_debt";

      observations.push({
        sourceEntityCode: geo,
        sourceMetricCode,
        periodLabel: period.label,
        periodType: period.periodType,
        year: period.year,
        quarter: period.quarter,
        month: period.month,
        value: new Decimal(cell.value),
        sourceUnitCode: unit ?? "MIO_EUR",
        status,
        sourceDimensions: cell.dimensions,
        publishedAt: dataset.updated ? new Date(dataset.updated) : undefined,
      });
    }

    return observations;
  }
}
