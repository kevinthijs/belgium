import { describe, expect, it } from "vitest";
import { debtReconciliationPasses, type DebtReconciliationRow } from "../nbb-eurostat-debt-reconciliation";

function row(overrides: Partial<DebtReconciliationRow>): DebtReconciliationRow {
  return {
    metric: "government_debt",
    year: 2025,
    quarter: 4,
    nbbValue: "692460",
    eurostatValue: "692460",
    difference: "0",
    classification: "MATCH",
    ...overrides,
  };
}

describe("debtReconciliationPasses", () => {
  it("passes when every row is MATCH or ROUNDING_DIFFERENCE", () => {
    const rows = [row({ classification: "MATCH" }), row({ quarter: 3, classification: "ROUNDING_DIFFERENCE" })];
    expect(debtReconciliationPasses(rows)).toBe(true);
  });

  it("fails when any row is INVESTIGATE", () => {
    const rows = [row({ classification: "MATCH" }), row({ quarter: 3, classification: "INVESTIGATE" })];
    expect(debtReconciliationPasses(rows)).toBe(false);
  });

  it("fails when there are no comparable rows at all", () => {
    expect(debtReconciliationPasses([])).toBe(false);
  });
});
