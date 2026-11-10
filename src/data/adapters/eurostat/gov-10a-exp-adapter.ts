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
 * Eurostat gov_10a_exp — general government expenditure by function
 * (COFOG). Dimensions: freq, unit, sector, cofog99, na_item, geo, time.
 *
 * We request na_item=TE (total expenditure) and unit=MIO_EUR only, for
 * COFOG level-I codes GF01..GF10 (the "TOTAL" pseudo-code is intentionally
 * never requested: gov_10a_main's TE already gives the S13 total, and
 * requesting COFOG's own TOTAL/PC_TOT/PC_GDP variants here would collide
 * with it under the observation-identity key since Unit isn't part of
 * that key — see hundred-euro-expenditure.ts for how shares are computed
 * on read instead).
 *
 * Consolidation note: these are Eurostat's own S13 (general government)
 * COFOG observations, not a sum of subsector (federal/regional/local/
 * social security) COFOG observations — ESA consolidation rules mean a
 * naive subsector sum would not equal the official S13 total.
 */
const COFOG_LEVEL_1_CODES = [
  "GF01",
  "GF02",
  "GF03",
  "GF04",
  "GF05",
  "GF06",
  "GF07",
  "GF08",
  "GF09",
  "GF10",
];

export class GovTenAExpAdapter implements DataSourceAdapter {
  readonly datasetCode = "gov_10a_exp";

  private readonly client: EurostatClient;

  constructor(client: EurostatClient = new EurostatClient()) {
    this.client = client;
  }

  async getMetadata(): Promise<DatasetMetadata> {
    return {
      datasetCode: this.datasetCode,
      title: "General government expenditure by function (COFOG)",
      source: "Eurostat",
    };
  }

  async checkForUpdate(state: ImportState): Promise<UpdateCheckResult> {
    const { checksum } = await this.client.fetchDataset(this.datasetCode, {
      filters: this.defaultFilters(),
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
      filters: options?.filters ?? this.defaultFilters(),
      since: options?.since,
    });
    return { datasetCode: this.datasetCode, format: "JSON_STAT", retrievedAt, checksum, payload: dataset };
  }

  private defaultFilters(): Record<string, string[]> {
    return {
      unit: ["MIO_EUR"],
      sector: ["S13"],
      geo: ["BE"],
      na_item: ["TE"],
      cofog99: COFOG_LEVEL_1_CODES,
    };
  }

  async validate(raw: RawDataset): Promise<ValidationResult> {
    const issues: ValidationResult["issues"] = [];
    if (raw.format !== "JSON_STAT") {
      issues.push({ path: "format", message: `Expected JSON_STAT, got ${raw.format}`, severity: "error" });
    }
    const dataset = raw.payload as JsonStatDataset;
    for (const required of ["geo", "time", "cofog99"]) {
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
      const cofog = cell.dimensions.cofog99;
      if (!geo || !time || !unit || !cofog || cell.value === null) continue;
      if (!COFOG_LEVEL_1_CODES.includes(cofog)) continue; // TOTAL or an unrequested sub-code

      const period = parseEurostatPeriod(time);
      const { status } = mapEurostatStatusFlag(cell.status);

      observations.push({
        sourceEntityCode: geo,
        sourceMetricCode: "government_expenditure",
        periodLabel: period.label,
        periodType: period.periodType,
        year: period.year,
        value: new Decimal(cell.value),
        sourceUnitCode: unit,
        status,
        sourceClassificationSystem: "COFOG",
        sourceClassificationCode: cofog.replace(/^GF/, ""), // "GF07" -> "07"
        sourceDimensions: cell.dimensions,
        publishedAt: dataset.updated ? new Date(dataset.updated) : undefined,
      });
    }

    return observations;
  }
}
