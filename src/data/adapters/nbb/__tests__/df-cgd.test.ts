import Decimal from "decimal.js";
import { describe, expect, it, vi } from "vitest";
import { NbbDatasetAdapter } from "../dataset-adapter";
import { DF_CGD_CONFIG } from "../df-cgd";
import type { NbbSdmxClient } from "../client";
import type { RawDataset } from "@/data/core/types";

const SAMPLE_CSV = [
  "DATAFLOW,FREQ,ITEM,GSECTOR,INSTRUMENT,TIME_PERIOD,OBS_VALUE,OBS_STATUS,CONF_STATUS,UNIT_MULT,DECIMALS",
  "BE2:DF_CGD(1.0),Q,CGD,S1300,F,2026-Q1,706581,A,F,6,0",
  "BE2:DF_CGD(1.0),Q,CGD,S1311,F,2026-Q1,565913,A,F,6,0",
  "BE2:DF_CGD(1.0),Q,CGD,S1312,F,2026-Q1,135844,A,F,6,0",
  // TCA (consolidating element) exists in the shared CL_CGD_ITEM codelist
  // but is not one of our verified metric mappings — must be skipped.
  "BE2:DF_CGD(1.0),Q,TCA,S1300,F,2026-Q1,-1234,A,F,6,0",
].join("\n");

function makeRaw(payload: string): RawDataset {
  return { datasetCode: "DF_CGD", format: "CSV", retrievedAt: new Date(), checksum: "x", payload };
}

describe("NbbDatasetAdapter.normalize with DF_CGD_CONFIG", () => {
  const adapter = new NbbDatasetAdapter(DF_CGD_CONFIG);

  it("maps ITEM=CGD to government_debt for S1300 and subsectorDebtContribution for subsectors", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    const byEntity = new Map(observations.map((o) => [o.sourceEntityCode, o.sourceMetricCode]));
    expect(byEntity.get("S1300")).toBe("government_debt");
    expect(byEntity.get("S1311")).toBe("subsectorDebtContribution");
    expect(byEntity.get("S1312")).toBe("subsectorDebtContribution");
  });

  it("skips ITEM codes without a verified mapping (TCA) rather than surfacing them as unmapped", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    expect(observations.some((o) => o.sourceDimensions?.rawItemCode === "TCA")).toBe(false);
    expect(observations).toHaveLength(3);
  });

  it("parses OBS_VALUE into a Decimal without precision loss, applying UNIT_MULT=6 as EUR millions", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    const s1300 = observations.find((o) => o.sourceEntityCode === "S1300")!;
    expect(s1300.value).toBeInstanceOf(Decimal);
    expect(s1300.value.toString()).toBe("706581");
  });

  it("parses the quarterly period into year/quarter/QUARTER periodType", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    expect(observations[0]!.periodType).toBe("QUARTER");
    expect(observations[0]!.year).toBe(2026);
    expect(observations[0]!.quarter).toBe(1);
  });

  it("records the implied EUR_MILLION unit code since DF_CGD has no UNIT dimension", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    expect(observations[0]!.sourceUnitCode).toBe("EUR_MILLION");
  });

  it("preserves GSECTOR/INSTRUMENT and the raw item code in sourceDimensions", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    const s1311 = observations.find((o) => o.sourceEntityCode === "S1311")!;
    expect(s1311.sourceDimensions).toMatchObject({ GSECTOR: "S1311", ITEM: "CGD", INSTRUMENT: "F", rawItemCode: "CGD" });
  });
});

describe("NbbDatasetAdapter.fetch with DF_CGD_CONFIG", () => {
  it("discovers dimension order live and constrains INSTRUMENT to the all-instruments aggregate", async () => {
    const fetchDataCsv = vi.fn().mockResolvedValue({ data: SAMPLE_CSV, checksum: "abc", retrievedAt: new Date(), url: "x", httpStatus: 200 });
    const fakeClient = {
      fetchStructure: vi.fn().mockResolvedValue({
        data: {
          dataflow: { id: "DF_CGD", agencyId: "BE2", version: "1.0", name: "x", dataStructureId: "DS_CGD" },
          dataStructure: {
            id: "DS_CGD",
            dimensions: [
              { id: "FREQ", position: 1 },
              { id: "ITEM", position: 2 },
              { id: "GSECTOR", position: 3 },
              { id: "INSTRUMENT", position: 4 },
            ],
          },
          codelists: new Map(),
        },
        url: "x",
        checksum: "y",
        retrievedAt: new Date(),
        httpStatus: 200,
      }),
      fetchDataCsv,
    } as unknown as NbbSdmxClient;

    const adapter = new NbbDatasetAdapter(DF_CGD_CONFIG, fakeClient);
    await adapter.fetch();

    expect(fetchDataCsv).toHaveBeenCalledWith(
      "DF_CGD",
      "1.0",
      expect.objectContaining({
        dimensionOrder: ["FREQ", "ITEM", "GSECTOR", "INSTRUMENT"],
        key: expect.objectContaining({
          FREQ: ["Q"],
          ITEM: ["CGD"],
          GSECTOR: ["S1300", "S1311", "S1312", "S1313", "S1314"],
          INSTRUMENT: ["F"],
        }),
      }),
    );
  });
});
