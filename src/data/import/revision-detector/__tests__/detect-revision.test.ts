import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { detectRevision } from "../detect-revision";

describe("detectRevision", () => {
  it("classifies a first-seen observation as NEW", () => {
    expect(detectRevision(null, new Decimal("706581"))).toEqual({ kind: "NEW" });
  });

  it("classifies an identical value as UNCHANGED even with different Decimal string representations", () => {
    const outcome = detectRevision(new Decimal("706581.000000"), new Decimal("706581"));
    expect(outcome.kind).toBe("UNCHANGED");
  });

  it("classifies a changed value as REVISED and preserves both values", () => {
    const outcome = detectRevision(new Decimal("706581"), new Decimal("706600"));
    expect(outcome).toMatchObject({
      kind: "REVISED",
      previousValue: new Decimal("706581"),
      newValue: new Decimal("706600"),
    });
  });

  it("treats a tiny decimal revision as REVISED, never rounds it away", () => {
    const outcome = detectRevision(new Decimal("706581.1"), new Decimal("706581.10001"));
    expect(outcome.kind).toBe("REVISED");
  });
});
