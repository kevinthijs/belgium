import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { StatbelPopulationAdapter } from "../statbel-population-adapter";
import type { RawDataset } from "@/data/core/types";

function fixtureRaw(): RawDataset {
  const workbook = XLSX.utils.book_new();
  const sheetData = [
    ["Bevolking per gemeente op 1 januari 2026"],
    ["NIS code", "Woonplaats", "Mannen", "Vrouwen", "Totaal"],
    [],
    [],
    ["01000", "België", 5851157, 6016477, 11867634],
    ["11001", "Aartselaar", 7531, 7554, 15085],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetData), "Bevolking in 2026");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return {
    datasetCode: "statbel_population_per_municipality",
    format: "XLSX",
    retrievedAt: new Date(),
    checksum: "test-checksum",
    payload: buffer,
  };
}

describe("StatbelPopulationAdapter", () => {
  const adapter = new StatbelPopulationAdapter();

  it("validates a well-formed workbook", async () => {
    const result = await adapter.validate(fixtureRaw());
    expect(result.valid).toBe(true);
  });

  it("rejects a non-XLSX payload", async () => {
    const result = await adapter.validate({ ...fixtureRaw(), format: "CSV" });
    expect(result.valid).toBe(false);
  });

  it("normalizes rows into DATE-period observations with an explicit referenceDate, never an averaged YEAR period", async () => {
    const observations = await adapter.normalize(fixtureRaw());
    const belgium = observations.find((o) => o.sourceEntityCode === "01000")!;

    expect(belgium.periodType).toBe("DATE");
    expect(belgium.referenceDate?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(belgium.sourceMetricCode).toBe("population");
    expect(belgium.sourceUnitCode).toBe("PERSONS");
    expect(belgium.value.toString()).toBe("11867634");
    expect(belgium.year).toBe(2026);
  });

  it("carries the source-native NIS code through untranslated, for entity resolution by code (never by name)", async () => {
    const observations = await adapter.normalize(fixtureRaw());
    const municipality = observations.find((o) => o.sourceEntityCode === "11001")!;
    expect(municipality.value.toString()).toBe("15085");
  });
});
