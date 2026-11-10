import { describe, expect, it } from "vitest";
import { checkComparability, type ComparableObservation } from "../comparison-compatibility";

const belgiumMaastrichtDebt: ComparableObservation = {
  metricCode: "government_debt",
  unitCode: "EUR_MILLION",
  accountingFrameworkCode: "EDP_MAASTRICHT",
  consolidationStatus: "CONSOLIDATED",
  periodType: "QUARTER",
};

const dutchMaastrichtDebt: ComparableObservation = { ...belgiumMaastrichtDebt };

const flemishBbcDebt: ComparableObservation = {
  metricCode: "government_debt",
  unitCode: "EUR_MILLION",
  accountingFrameworkCode: "BBC_FLANDERS",
  consolidationStatus: "UNCONSOLIDATED",
  periodType: "QUARTER",
};

describe("checkComparability", () => {
  it("allows two harmonised Maastricht-debt observations", () => {
    const result = checkComparability(belgiumMaastrichtDebt, dutchMaastrichtDebt);
    expect(result.verdict).toBe("COMPATIBLE");
    expect(result.reasons).toHaveLength(0);
  });

  it("rejects comparing different metrics outright", () => {
    const result = checkComparability(belgiumMaastrichtDebt, { ...belgiumMaastrichtDebt, metricCode: "gdp" });
    expect(result.verdict).toBe("INCOMPATIBLE");
  });

  it("rejects comparing different units outright", () => {
    const result = checkComparability(belgiumMaastrichtDebt, { ...belgiumMaastrichtDebt, unitCode: "PERCENT_GDP" });
    expect(result.verdict).toBe("INCOMPATIBLE");
  });

  it("rejects mixing quarterly and annual periods outright", () => {
    const result = checkComparability(belgiumMaastrichtDebt, { ...belgiumMaastrichtDebt, periodType: "YEAR" });
    expect(result.verdict).toBe("INCOMPATIBLE");
  });

  it("flags Flemish BBC debt vs Belgian Maastricht debt as compatible-with-warning, not silently compatible", () => {
    const result = checkComparability(belgiumMaastrichtDebt, flemishBbcDebt);
    expect(result.verdict).toBe("COMPATIBLE_WITH_WARNING");
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
