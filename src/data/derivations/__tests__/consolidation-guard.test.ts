import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { compareSubsectorSumToOfficialS13, GOVERNMENT_SUBSECTOR_SLUGS } from "../consolidation-guard";

describe("consolidation guard", () => {
  it("lists exactly the four ESA subsectors, never S13 itself", () => {
    expect(GOVERNMENT_SUBSECTOR_SLUGS).toEqual([
      "federale-overheid",
      "gemeenschappen-en-gewesten",
      "lokale-overheden",
      "sociale-zekerheid",
    ]);
    expect(GOVERNMENT_SUBSECTOR_SLUGS).not.toContain("belgie");
  });

  it("requires exactly one value per subsector — refuses to silently pad/drop", () => {
    expect(() =>
      compareSubsectorSumToOfficialS13([new Decimal(1), new Decimal(2)], new Decimal(3)),
    ).toThrow();
  });

  it("proves a naive subsector sum does NOT automatically equal S13 when transfers exist", () => {
    // Realistic shape: subsector revenues include intergovernmental
    // transfers counted on both the paying and receiving side, so their
    // sum overstates consolidated S13 revenue.
    const federal = new Decimal(150_000);
    const communities = new Decimal(60_000); // largely federal-dotation funded
    const local = new Decimal(40_000);
    const socialSecurity = new Decimal(90_000);
    const officialS13 = new Decimal(250_681.2); // consolidated, from docs/NBB_DATA_DISCOVERY.md

    const result = compareSubsectorSumToOfficialS13([federal, communities, local, socialSecurity], officialS13);

    expect(result.subsectorSum.toString()).toBe("340000");
    expect(result.matchesWithinTolerance).toBe(false);
  });

  it("only reports a match within an explicit tolerance, never exact-equality-by-accident silently", () => {
    const parts = [new Decimal(100), new Decimal(100), new Decimal(100), new Decimal(100.1)];
    const result = compareSubsectorSumToOfficialS13(parts, new Decimal(400));
    expect(result.matchesWithinTolerance).toBe(true); // within default 0.5 tolerance
    expect(result.difference.toString()).toBe("0.1");
  });

  it("proves DF_CGD subsector debt contributions do NOT sum to the official S1300 total either", () => {
    // Live NBB DF_CGD values, 2026-Q1 (EUR million), ITEM=CGD, INSTRUMENT=F:
    // S1311=565913, S1312=135844, S1313=27889, S1314=373, S1300=706581.
    const federal = new Decimal(565_913);
    const communities = new Decimal(135_844);
    const local = new Decimal(27_889);
    const socialSecurity = new Decimal(373);
    const officialS1300 = new Decimal(706_581);

    const result = compareSubsectorSumToOfficialS13([federal, communities, local, socialSecurity], officialS1300);

    expect(result.subsectorSum.toString()).toBe("730019");
    expect(result.difference.toString()).toBe("23438");
    expect(result.matchesWithinTolerance).toBe(false);
  });
});
