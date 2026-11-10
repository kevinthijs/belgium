import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { computeLinearChangeEstimate } from "../debt-estimate";

describe("computeLinearChangeEstimate", () => {
  it("annualizes a quarterly change by multiplying by 4", () => {
    // 706,581,000,000 -> 720,000,000,000 over one quarter
    const previous = new Decimal("706581000000");
    const latest = new Decimal("720702000000");
    const result = computeLinearChangeEstimate(previous, latest);

    expect(result.quarterlyChange.toString()).toBe("14121000000");
    expect(result.annualizedChange.toString()).toBe("56484000000");
  });

  it("supports a decreasing debt trend (negative change)", () => {
    const previous = new Decimal("706581000000");
    const latest = new Decimal("700000000000");
    const result = computeLinearChangeEstimate(previous, latest);

    expect(result.quarterlyChange.isNegative()).toBe(true);
    expect(result.annualizedChange.isNegative()).toBe(true);
  });

  it("keeps full precision for amounts in the hundreds of billions (no float rounding)", () => {
    // A value that is not exactly representable in IEEE-754 doubles at this
    // magnitude; Decimal must preserve it exactly.
    const previous = new Decimal("706581000000.13");
    const latest = new Decimal("706581000000.14");
    const result = computeLinearChangeEstimate(previous, latest);

    expect(result.quarterlyChange.toString()).toBe("0.01");
  });
});
