import { describe, expect, it } from "vitest";
import { reconciliationPasses, type ReconciliationRow } from "../nbb-eurostat-reconciliation";

function row(overrides: Partial<ReconciliationRow>): ReconciliationRow {
  return {
    metric: "government_revenue",
    year: 2023,
    nbbValue: "100",
    eurostatValue: "100",
    difference: "0",
    classification: "MATCH",
    ...overrides,
  };
}

describe("reconciliationPasses", () => {
  it("passes when every row is MATCH or ROUNDING_DIFFERENCE", () => {
    const rows = [row({ classification: "MATCH" }), row({ classification: "ROUNDING_DIFFERENCE" })];
    expect(reconciliationPasses(rows)).toBe(true);
  });

  it("fails when any row is INVESTIGATE", () => {
    const rows = [row({ classification: "MATCH" }), row({ classification: "INVESTIGATE" })];
    expect(reconciliationPasses(rows)).toBe(false);
  });

  it("fails when there are no comparable rows at all", () => {
    expect(reconciliationPasses([])).toBe(false);
  });
});
