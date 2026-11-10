import Decimal from "decimal.js";
import { describe, expect, it, vi } from "vitest";
import { NbbDatasetAdapter } from "../dataset-adapter";
import { DF_NFGOV_DISS_CONFIG } from "../df-nfgov-diss";
import type { NbbSdmxClient } from "../client";
import type { RawDataset } from "@/data/core/types";

const SAMPLE_CSV = [
  "DATAFLOW,FREQ,GOVTYPE,ITEM,UNIT,TIME_PERIOD,OBS_VALUE,OBS_STATUS,CONF_STATUS,UNIT_MULT,DECIMALS",
  "BE2:DF_NFGOV_DISS(1.0),A,S1311,TOR,E,2023,150000.5,A,F,,1",
  "BE2:DF_NFGOV_DISS(1.0),A,S1311,TOE,E,2023,160000.1,A,F,,1",
  "BE2:DF_NFGOV_DISS(1.0),A,S1311,DEF,E,2023,-9999.6,P,F,,1",
  // GGREC exists in the shared codelist but is not one of our verified
  // metric mappings — must be skipped, not surfaced as "unmapped" noise.
  "BE2:DF_NFGOV_DISS(1.0),A,S1311,GGREC,E,2023,1.0,A,F,,1",
].join("\n");

function makeRaw(payload: string): RawDataset {
  return { datasetCode: "DF_NFGOV_DISS", format: "CSV", retrievedAt: new Date(), checksum: "x", payload };
}

describe("NbbDatasetAdapter.normalize", () => {
  const adapter = new NbbDatasetAdapter(DF_NFGOV_DISS_CONFIG);

  it("maps only verified ITEM codes to canonical metric codes", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    expect(observations.map((o) => o.sourceMetricCode).sort()).toEqual(
      ["government_revenue", "government_expenditure", "net_lending_borrowing"].sort(),
    );
  });

  it("parses OBS_VALUE into a Decimal without precision loss", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    const revenue = observations.find((o) => o.sourceMetricCode === "government_revenue")!;
    expect(revenue.value).toBeInstanceOf(Decimal);
    expect(revenue.value.toString()).toBe("150000.5");
  });

  it("preserves the raw NBB dimensions and item code in sourceDimensions", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    const revenue = observations.find((o) => o.sourceMetricCode === "government_revenue")!;
    expect(revenue.sourceDimensions).toMatchObject({ GOVTYPE: "S1311", ITEM: "TOR", rawItemCode: "TOR" });
  });

  it("maps OBS_STATUS=P to PROVISIONAL", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    const balance = observations.find((o) => o.sourceMetricCode === "net_lending_borrowing")!;
    expect(balance.status).toBe("PROVISIONAL");
  });

  it("parses the annual period into year/YEAR periodType", async () => {
    const observations = await adapter.normalize(makeRaw(SAMPLE_CSV));
    expect(observations[0]!.periodType).toBe("YEAR");
    expect(observations[0]!.year).toBe(2023);
  });
});

describe("NbbDatasetAdapter.fetch", () => {
  it("discovers dimension order from the live DSD instead of assuming it", async () => {
    const fetchDataCsv = vi.fn().mockResolvedValue({ data: SAMPLE_CSV, checksum: "abc", retrievedAt: new Date(), url: "x", httpStatus: 200 });
    const fakeClient = {
      fetchStructure: vi.fn().mockResolvedValue({
        data: {
          dataflow: { id: "DF_NFGOV_DISS", agencyId: "BE2", version: "1.0", name: "x", dataStructureId: "DS_NFGOV_DISS" },
          dataStructure: {
            id: "DS_NFGOV_DISS",
            dimensions: [
              { id: "UNIT", position: 4 },
              { id: "FREQ", position: 1 },
              { id: "ITEM", position: 3 },
              { id: "GOVTYPE", position: 2 },
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

    const adapter = new NbbDatasetAdapter(DF_NFGOV_DISS_CONFIG, fakeClient);
    await adapter.fetch();

    expect(fetchDataCsv).toHaveBeenCalledWith(
      "DF_NFGOV_DISS",
      "1.0",
      expect.objectContaining({ dimensionOrder: ["FREQ", "GOVTYPE", "ITEM", "UNIT"] }),
    );
  });
});
