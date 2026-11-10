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
 * Eurostat gov_10a_taxag — "Main national accounts tax aggregates" for
 * general government (S13). Dataset code verified live against the
 * Eurostat dissemination API (catalogue TOC + a live query) on 2026-09-19,
 * not assumed from documentation.
 *
 * This dataset explains *taxation*, not total government revenue — the
 * two are never conflated. See src/data/derivations/hundred-euro-revenue.ts
 * for how these categories are reconciled against gov_10a_main's TR.
 */
const NA_ITEM_TO_METRIC: Record<string, string> = {
  D2: "taxes_production_imports",
  D211: "taxes_vat",
  D5: "taxes_income",
  D51A: "taxes_income_personal",
  D51B: "taxes_income_corporate",
  D61: "social_contributions",
  D91: "capital_taxes",
  D2_D5_D91: "total_tax_receipts",
};

const REQUESTED_NA_ITEMS = Object.keys(NA_ITEM_TO_METRIC);

export class GovTenATaxagAdapter implements DataSourceAdapter {
  readonly datasetCode = "gov_10a_taxag";

  private readonly client: EurostatClient;

  constructor(client: EurostatClient = new EurostatClient()) {
    this.client = client;
  }

  async getMetadata(): Promise<DatasetMetadata> {
    return {
      datasetCode: this.datasetCode,
      title: "Main national accounts tax aggregates",
      source: "Eurostat",
    };
  }

  async checkForUpdate(state: ImportState): Promise<UpdateCheckResult> {
    const { checksum } = await this.client.fetchDataset(this.datasetCode, { filters: this.defaultFilters() });
    const hasUpdate = state.lastImportedChecksum !== checksum;
    return {
      hasUpdate,
      remoteChecksum: checksum,
      reason: hasUpdate ? "Remote payload checksum differs from last import" : "No change since last import",
    };
  }

  async fetch(options?: FetchOptions): Promise<RawDataset> {
    const { dataset, checksum, retrievedAt } = await this.client.fetchDataset(this.datasetCode, {
      filters: options?.filters ?? this.defaultFilters(),
      since: options?.since,
    });
    return { datasetCode: this.datasetCode, format: "JSON_STAT", retrievedAt, checksum, payload: dataset };
  }

  private defaultFilters(): Record<string, string[]> {
    return { unit: ["MIO_EUR"], sector: ["S13"], geo: ["BE"], na_item: REQUESTED_NA_ITEMS };
  }

  async validate(raw: RawDataset): Promise<ValidationResult> {
    const issues: ValidationResult["issues"] = [];
    if (raw.format !== "JSON_STAT") {
      issues.push({ path: "format", message: `Expected JSON_STAT, got ${raw.format}`, severity: "error" });
    }
    const dataset = raw.payload as JsonStatDataset;
    for (const required of ["geo", "time", "na_item"]) {
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

      const sourceMetricCode = NA_ITEM_TO_METRIC[naItem];
      if (!sourceMetricCode) continue; // not one of the codes we requested/mapped

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
