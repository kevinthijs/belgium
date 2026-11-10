import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { computeDebtPerCapita } from "../debt-per-capita";

describe("computeDebtPerCapita", () => {
  it("divides debt by population", () => {
    const debt = new Decimal("733162967459");
    const population = new Decimal("11867634");
    const result = computeDebtPerCapita(debt, population);

    expect(result.toDecimalPlaces(2).toString()).toBe("61778.36");
  });

  it("keeps full Decimal precision instead of losing cents to float rounding", () => {
    const debt = new Decimal("100000000000.37");
    const population = new Decimal("11000000");
    const result = computeDebtPerCapita(debt, population);

    // A plain `Number` division of these two values loses precision;
    // Decimal must not.
    expect(result.toString()).not.toBe(String(100000000000.37 / 11000000));
    expect(result.toDecimalPlaces(6).toString()).toBe("9090.909091");
  });

  it("refuses to divide by a zero population rather than returning Infinity/NaN", () => {
    expect(() => computeDebtPerCapita(new Decimal("100"), new Decimal(0))).toThrow();
  });
});
