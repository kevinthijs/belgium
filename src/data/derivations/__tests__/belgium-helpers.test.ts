import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { selectPopulationForYear, computeShareOfTotal, sortByDebtToGdpDescending } from "../belgium-helpers";

describe("selectPopulationForYear", () => {
  const byYear = new Map<number, Decimal>([
    [2020, new Decimal(11_000_000)],
    [2023, new Decimal(11_700_000)],
    [2025, new Decimal(11_900_000)],
  ]);

  it("returns the exact-year population when it exists", () => {
    expect(selectPopulationForYear(byYear, 2023)!.toString()).toBe("11700000");
  });

  it("falls back to the most recent prior year when the exact year is missing", () => {
    expect(selectPopulationForYear(byYear, 2024)!.toString()).toBe("11700000");
  });

  it("never returns a future year's population", () => {
    // 2021 has no data of its own or any earlier than 2020, so it should fall back to 2020, not 2023.
    expect(selectPopulationForYear(byYear, 2021)!.toString()).toBe("11000000");
  });

  it("returns null when there is no year at or before the target", () => {
    expect(selectPopulationForYear(byYear, 2019)).toBeNull();
  });
});

describe("computeShareOfTotal", () => {
  it("computes a one-decimal percentage share", () => {
    const share = computeShareOfTotal(new Decimal(25), new Decimal(200));
    expect(share.toString()).toBe("12.5");
  });

  it("throws rather than dividing by a zero or negative total", () => {
    expect(() => computeShareOfTotal(new Decimal(10), new Decimal(0))).toThrow();
    expect(() => computeShareOfTotal(new Decimal(10), new Decimal(-5))).toThrow();
  });
});

describe("sortByDebtToGdpDescending", () => {
  it("orders rows by descending debt/GDP ratio", () => {
    const rows = [
      { entitySlug: "a", debtToGdp: { available: true as const, rawValue: "60" } },
      { entitySlug: "b", debtToGdp: { available: true as const, rawValue: "105" } },
      { entitySlug: "c", debtToGdp: { available: true as const, rawValue: "90" } },
    ];
    expect(sortByDebtToGdpDescending(rows).map((r) => r.entitySlug)).toEqual(["b", "c", "a"]);
  });

  it("sinks unavailable rows to the bottom without throwing", () => {
    const rows = [
      { entitySlug: "a", debtToGdp: { available: false as const } },
      { entitySlug: "b", debtToGdp: { available: true as const, rawValue: "105" } },
    ];
    expect(sortByDebtToGdpDescending(rows).map((r) => r.entitySlug)).toEqual(["b", "a"]);
  });
});
