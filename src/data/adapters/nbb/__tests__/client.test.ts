import { describe, expect, it } from "vitest";
import { NbbSdmxClient } from "../client";

describe("NbbSdmxClient URL generation", () => {
  const client = new NbbSdmxClient();

  it("builds the structure URL with references=all", () => {
    const url = client.buildStructureUrl("DF_NFGOV_DISS");
    expect(url).toBe("https://nsidisseminate-stat.nbb.be/rest/dataflow/BE2/DF_NFGOV_DISS?references=all");
  });

  it("builds a data URL joining multi-value dimensions with '+' and dimensions with '.'", () => {
    const url = client.buildDataUrl("DF_NFGOV_DISS", "1.0", {
      dimensionOrder: ["FREQ", "GOVTYPE", "ITEM", "UNIT"],
      key: {
        FREQ: ["A"],
        GOVTYPE: ["S1311", "S1312"],
        ITEM: ["TOR", "TOE"],
        UNIT: ["E"],
      },
    });
    expect(url).toBe(
      "https://nsidisseminate-stat.nbb.be/rest/data/BE2,DF_NFGOV_DISS,1.0/A.S1311+S1312.TOR+TOE.E?format=csv",
    );
  });

  it("wildcards an omitted dimension as an empty key segment", () => {
    const url = client.buildDataUrl("DF_NFGOV_DISS", "1.0", {
      dimensionOrder: ["FREQ", "GOVTYPE", "ITEM", "UNIT"],
      key: { FREQ: ["A"], GOVTYPE: ["S1311"], UNIT: ["E"] },
    });
    expect(url).toBe("https://nsidisseminate-stat.nbb.be/rest/data/BE2,DF_NFGOV_DISS,1.0/A.S1311..E?format=csv");
  });

  it("never targets the legacy dead endpoint", () => {
    const url = client.buildStructureUrl("DF_NFGOV_DISS");
    expect(url).not.toContain("stat.nbb.be/RestSDMX");
  });
});
