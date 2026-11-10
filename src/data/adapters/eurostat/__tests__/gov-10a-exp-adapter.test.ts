import { describe, expect, it } from "vitest";
import { GovTenAExpAdapter } from "../gov-10a-exp-adapter";
import type { JsonStatDataset } from "../json-stat-parser";
import type { RawDataset } from "@/data/core/types";

function buildRawDataset(): RawDataset {
  const dataset: JsonStatDataset = {
    class: "dataset",
    id: ["unit", "sector", "cofog99", "na_item", "geo", "time"],
    size: [1, 1, 3, 1, 1, 1],
    dimension: {
      unit: { label: "unit", category: { index: { MIO_EUR: 0 }, label: { MIO_EUR: "Million euro" } } },
      sector: { label: "sector", category: { index: { S13: 0 }, label: { S13: "General government" } } },
      cofog99: {
        label: "cofog99",
        category: {
          index: { GF07: 0, GF10: 1, TOTAL: 2 },
          label: { GF07: "Health", GF10: "Social protection", TOTAL: "Total" },
        },
      },
      na_item: { label: "na_item", category: { index: { TE: 0 }, label: { TE: "Total expenditure" } } },
      geo: { label: "geo", category: { index: { BE: 0 }, label: { BE: "Belgium" } } },
      time: { label: "time", category: { index: { "2023": 0 }, label: { "2023": "2023" } } },
    },
    value: { 0: 41000, 1: 62000, 2: 260000 },
    status: { 2: "p" },
    updated: "2026-06-15",
  };
  return { datasetCode: "gov_10a_exp", format: "JSON_STAT", retrievedAt: new Date(), checksum: "abc", payload: dataset };
}

describe("GovTenAExpAdapter.normalize", () => {
  it("maps COFOG level-I codes to classification items, stripping the GF prefix", async () => {
    const adapter = new GovTenAExpAdapter();
    const observations = await adapter.normalize(buildRawDataset());

    const health = observations.find((o) => o.sourceClassificationCode === "07");
    expect(health).toBeDefined();
    expect(health?.sourceClassificationSystem).toBe("COFOG");
    expect(health?.value.toString()).toBe("41000");
    expect(health?.sourceMetricCode).toBe("government_expenditure");

    const socialProtection = observations.find((o) => o.sourceClassificationCode === "10");
    expect(socialProtection?.value.toString()).toBe("62000");
  });

  it("never emits an observation for the COFOG TOTAL pseudo-code (S13 consolidation guard)", async () => {
    const adapter = new GovTenAExpAdapter();
    const observations = await adapter.normalize(buildRawDataset());

    // The TOTAL cell (260000) must never surface as a classification-coded
    // observation, and the S13 national total must always come from
    // gov_10a_main directly rather than being reconstructed by summing
    // COFOG categories here.
    expect(observations.some((o) => o.value.toString() === "260000")).toBe(false);
    expect(observations).toHaveLength(2);
    expect(observations.every((o) => o.sourceClassificationCode !== undefined)).toBe(true);
  });
});
