import { describe, expect, it } from "vitest";
import { periodBounds } from "../resolve-period";

describe("periodBounds", () => {
  it("computes full-year bounds", () => {
    const { startDate, endDate } = periodBounds({ periodType: "YEAR", year: 2025 });
    expect(startDate.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(endDate.toISOString()).toBe("2025-12-31T00:00:00.000Z");
  });

  it("computes quarter bounds without drifting into the next month", () => {
    const { startDate, endDate } = periodBounds({ periodType: "QUARTER", year: 2026, quarter: 1 });
    expect(startDate.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(endDate.toISOString()).toBe("2026-03-31T00:00:00.000Z");
  });

  it("computes Q4 bounds correctly at the year boundary", () => {
    const { endDate } = periodBounds({ periodType: "QUARTER", year: 2025, quarter: 4 });
    expect(endDate.toISOString()).toBe("2025-12-31T00:00:00.000Z");
  });

  it("computes month bounds, including leap-year February", () => {
    const { endDate } = periodBounds({ periodType: "MONTH", year: 2024, month: 2 });
    expect(endDate.getUTCDate()).toBe(29);
  });

  it("throws when a DATE period is missing its referenceDate", () => {
    expect(() => periodBounds({ periodType: "DATE", year: 2025 })).toThrow();
  });

  it("pins DATE period bounds to the exact reference date, not a range", () => {
    const referenceDate = new Date(Date.UTC(2026, 0, 1));
    const { startDate, endDate } = periodBounds({ periodType: "DATE", year: 2026, referenceDate });
    expect(startDate.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(endDate.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
