import Decimal from "decimal.js";
import type {
  DataSourceAdapter,
  DatasetMetadata,
  ImportState,
  NormalizedObservation,
  RawDataset,
  UpdateCheckResult,
  ValidationResult,
} from "@/data/core/types";
import { StatbelPopulationClient } from "./population-client";
import { parsePopulationWorkbook, type StatbelPopulationRow } from "./population-xlsx-parser";

/**
 * Statbel "Bevolking per gemeente op 1 januari" — the official legal
 * population of Belgium, its 3 regions and all municipalities, on 1
 * January of every year since 1992. This is a point-in-time stock
 * measurement, not an annual average — periodType is "DATE" with an
 * explicit referenceDate so that fact is never lost downstream.
 *
 * Entity mapping is by NIS code only (never by municipality name), via
 * the generic ExternalEntityIdentifier scheme "NIS".
 */
export class StatbelPopulationAdapter implements DataSourceAdapter {
  readonly datasetCode = "statbel_population_per_municipality";

  private readonly client: StatbelPopulationClient;

  constructor(client: StatbelPopulationClient = new StatbelPopulationClient()) {
    this.client = client;
  }

  async getMetadata(): Promise<DatasetMetadata> {
    return {
      datasetCode: this.datasetCode,
      title: "Bevolking per gemeente op 1 januari (1992-2026)",
      source: "Statbel",
    };
  }

  async checkForUpdate(state: ImportState): Promise<UpdateCheckResult> {
    const { checksum } = await this.client.fetchWorkbook();
    const hasUpdate = state.lastImportedChecksum !== checksum;
    return {
      hasUpdate,
      remoteChecksum: checksum,
      reason: hasUpdate
        ? "Remote workbook checksum differs from last import"
        : "No change since last import",
    };
  }

  async fetch(): Promise<RawDataset> {
    const { buffer, checksum, retrievedAt } = await this.client.fetchWorkbook();
    return {
      datasetCode: this.datasetCode,
      format: "XLSX",
      retrievedAt,
      checksum,
      payload: buffer,
    };
  }

  async validate(raw: RawDataset): Promise<ValidationResult> {
    const issues: ValidationResult["issues"] = [];
    if (raw.format !== "XLSX") {
      issues.push({ path: "format", message: `Expected XLSX, got ${raw.format}`, severity: "error" });
      return { valid: false, issues };
    }
    try {
      const rows = parsePopulationWorkbook(raw.payload as Buffer);
      if (rows.length === 0) {
        issues.push({ path: "rows", message: "No population rows found in workbook", severity: "error" });
      }
      const countryRows = rows.filter((r) => r.kind === "COUNTRY");
      if (countryRows.length === 0) {
        issues.push({ path: "rows", message: "No national-level (NIS 01000) row found", severity: "error" });
      }
    } catch (error) {
      issues.push({
        path: "workbook",
        message: error instanceof Error ? error.message : String(error),
        severity: "error",
      });
    }
    return { valid: issues.every((i) => i.severity !== "error"), issues };
  }

  async normalize(raw: RawDataset): Promise<NormalizedObservation[]> {
    const rows = parsePopulationWorkbook(raw.payload as Buffer);
    return rows.map((row) => toNormalizedObservation(row));
  }
}

function toNormalizedObservation(row: StatbelPopulationRow): NormalizedObservation {
  const referenceDate = new Date(Date.UTC(row.year, 0, 1));
  return {
    sourceEntityCode: row.nisCode,
    sourceMetricCode: "population",
    periodLabel: `1 januari ${row.year}`,
    periodType: "DATE",
    year: row.year,
    referenceDate,
    value: new Decimal(row.total),
    sourceUnitCode: "PERSONS",
    status: "FINAL",
    sourceDimensions: { nisCode: row.nisCode, name: row.name, kind: row.kind },
    publishedAt: referenceDate,
  };
}
