import { describe, expect, it } from "vitest";
import {
  DEBT_CONTRIBUTION_METHODOLOGY_NOTE,
  DEBT_CONTRIBUTION_CONSOLIDATION_WARNING,
} from "../government-sectors-copy";

/**
 * Debt-contribution figures must never be casually mislabelled as a
 * subsector's own standalone debt (e.g. "schuld van de federale
 * overheid") — the UI copy must carry the "contribution to the
 * consolidated total" framing NBB itself uses.
 */
describe("debt contribution UI-safe terminology", () => {
  it("methodology note frames the figure as a contribution to the consolidated total, not standalone debt", () => {
    expect(DEBT_CONTRIBUTION_METHODOLOGY_NOTE).toContain("bijdrage");
    expect(DEBT_CONTRIBUTION_METHODOLOGY_NOTE).toContain("geconsolideerde");
    expect(DEBT_CONTRIBUTION_METHODOLOGY_NOTE.toLowerCase()).not.toMatch(/schuld van de federale overheid/);
    expect(DEBT_CONTRIBUTION_METHODOLOGY_NOTE.toLowerCase()).not.toMatch(/schuld van vlaanderen/);
  });

  it("consolidation warning explicitly states the subsector figures do not sum to the official total", () => {
    expect(DEBT_CONTRIBUTION_CONSOLIDATION_WARNING).toContain("niet exact op");
  });
});
