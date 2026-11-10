import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { computeHundredEuroShares } from "../hundred-euro-expenditure";

describe("computeHundredEuroShares", () => {
  it("sorts categories descending by value", () => {
    const result = computeHundredEuroShares(
      [
        { code: "A", label: "A", valueEUR: new Decimal(10) },
        { code: "B", label: "B", valueEUR: new Decimal(50) },
        { code: "C", label: "C", valueEUR: new Decimal(30) },
      ],
      new Decimal(90),
    );
    expect(result.map((c) => c.code)).toEqual(["B", "C", "A"]);
  });

  it("computes share and per-€100 amount without forcing an exact €100 sum", () => {
    const result = computeHundredEuroShares(
      [
        { code: "A", label: "A", valueEUR: new Decimal(33) },
        { code: "B", label: "B", valueEUR: new Decimal(33) },
        { code: "C", label: "C", valueEUR: new Decimal(34) },
      ],
      new Decimal(100),
    );
    // 33/100 + 33/100 + 34/100 = 100 exactly here, but the function must not
    // special-case or round to force this — verify it derives shares purely
    // from the given values, with no synthetic "other" category injected.
    expect(result).toHaveLength(3);
    expect(result.find((c) => c.code === "OTHER")).toBeUndefined();
    const a = result.find((c) => c.code === "A")!;
    expect(a.share.toString()).toBe("0.33");
    expect(a.amountPer100.toString()).toBe("33");
  });

  it("does not force rounding to sum to exactly 100 when the total isn't a round divisor", () => {
    const result = computeHundredEuroShares(
      [
        { code: "A", label: "A", valueEUR: new Decimal(1) },
        { code: "B", label: "B", valueEUR: new Decimal(1) },
        { code: "C", label: "C", valueEUR: new Decimal(1) },
      ],
      new Decimal(3),
    );
    const sum = result.reduce((acc, c) => acc.plus(c.amountPer100), new Decimal(0));
    // Full (unrounded) Decimal precision sums back to 100 within a
    // negligible epsilon; display formatting, not this calculation, is
    // responsible for rounding each category for presentation.
    expect(sum.toDecimalPlaces(6).toString()).toBe("100");
    expect(result[0]!.amountPer100.toDecimalPlaces(2).toString()).toBe("33.33");
  });

  it("throws on a non-positive compatible total instead of dividing by zero", () => {
    expect(() =>
      computeHundredEuroShares([{ code: "A", label: "A", valueEUR: new Decimal(10) }], new Decimal(0)),
    ).toThrow();
    expect(() =>
      computeHundredEuroShares([{ code: "A", label: "A", valueEUR: new Decimal(10) }], new Decimal(-5)),
    ).toThrow();
  });
});
