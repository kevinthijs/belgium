import { describe, expect, it } from "vitest";
import { mapEurostatStatusFlag, parseEurostatPeriod } from "../dimension-mapper";

describe("mapEurostatStatusFlag", () => {
  it("maps known flags", () => {
    expect(mapEurostatStatusFlag("p")).toEqual({ status: "PROVISIONAL", recognised: true });
    expect(mapEurostatStatusFlag("e")).toEqual({ status: "ESTIMATE", recognised: true });
  });

  it("defaults missing flags to FINAL", () => {
    expect(mapEurostatStatusFlag(undefined)).toEqual({ status: "FINAL", recognised: true });
  });

  it("flags unrecognised codes instead of silently pretending they're known", () => {
    const result = mapEurostatStatusFlag("zzz");
    expect(result.recognised).toBe(false);
  });
});

describe("parseEurostatPeriod", () => {
  it("parses year, quarter and month codes", () => {
    expect(parseEurostatPeriod("2026")).toMatchObject({ periodType: "YEAR", year: 2026 });
    expect(parseEurostatPeriod("2026-Q1")).toMatchObject({ periodType: "QUARTER", year: 2026, quarter: 1 });
    expect(parseEurostatPeriod("2026-01")).toMatchObject({ periodType: "MONTH", year: 2026, month: 1 });
  });

  it("throws on unrecognised period codes rather than guessing", () => {
    expect(() => parseEurostatPeriod("not-a-period")).toThrow();
  });
});
