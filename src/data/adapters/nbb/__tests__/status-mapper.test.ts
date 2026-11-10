import { describe, expect, it } from "vitest";
import { mapNbbObsStatus, parseNbbAnnualPeriod, parseNbbQuarterPeriod } from "../status-mapper";

describe("mapNbbObsStatus", () => {
  it("maps normal (A) to FINAL", () => {
    expect(mapNbbObsStatus("A")).toEqual({ status: "FINAL", recognised: true });
  });

  it("maps provisional (P) to PROVISIONAL", () => {
    expect(mapNbbObsStatus("P")).toEqual({ status: "PROVISIONAL", recognised: true });
  });

  it("maps a time-series break (B) to FINAL — the value itself is real", () => {
    expect(mapNbbObsStatus("B")).toEqual({ status: "FINAL", recognised: true });
  });

  it("does not assume FINAL by default for a missing flag — flags it as unrecognised", () => {
    expect(mapNbbObsStatus(undefined)).toEqual({ status: "FINAL", recognised: false });
  });

  it("flags an unknown code as unrecognised rather than silently mapping it", () => {
    expect(mapNbbObsStatus("Z")).toEqual({ status: "FINAL", recognised: false });
  });
});

describe("parseNbbAnnualPeriod", () => {
  it("parses a 4-digit year", () => {
    expect(parseNbbAnnualPeriod("2023")).toEqual({ periodType: "YEAR", year: 2023, label: "2023" });
  });

  it("throws on a non-annual period code", () => {
    expect(() => parseNbbAnnualPeriod("2023-Q1")).toThrow();
  });
});

describe("parseNbbQuarterPeriod", () => {
  it("parses a YYYY-Qn period", () => {
    expect(parseNbbQuarterPeriod("1998-Q4")).toEqual({ periodType: "QUARTER", year: 1998, quarter: 4, label: "1998-Q4" });
  });

  it("throws on an annual-only period code", () => {
    expect(() => parseNbbQuarterPeriod("2023")).toThrow();
  });

  it("throws on an out-of-range quarter", () => {
    expect(() => parseNbbQuarterPeriod("2023-Q5")).toThrow();
  });
});
