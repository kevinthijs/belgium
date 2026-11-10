import { describe, expect, it } from "vitest";
import { computeRevisionDiff } from "../revision-diff";

describe("computeRevisionDiff", () => {
  it("returns no diff at all for a brand-new observation (no previous value)", () => {
    const result = computeRevisionDiff(null, "100");
    expect(result.absoluteDifference).toBeNull();
    expect(result.percentageDifference).toBeNull();
  });

  it("computes a positive absolute and percentage difference when the value increased", () => {
    const result = computeRevisionDiff("100", "110");
    expect(result.absoluteDifference?.toString()).toBe("10");
    expect(result.percentageDifference?.toString()).toBe("10");
  });

  it("computes a negative difference when the value decreased", () => {
    const result = computeRevisionDiff("100", "90");
    expect(result.absoluteDifference?.toString()).toBe("-10");
    expect(result.percentageDifference?.toString()).toBe("-10");
  });

  it("never divides by zero — a previous value of exactly zero yields no percentage", () => {
    const result = computeRevisionDiff("0", "50");
    expect(result.absoluteDifference?.toString()).toBe("50");
    expect(result.percentageDifference).toBeNull();
  });

  it("handles numeric and Decimal-like inputs consistently", () => {
    const result = computeRevisionDiff(100, 105);
    expect(result.absoluteDifference?.toString()).toBe("5");
  });
});
