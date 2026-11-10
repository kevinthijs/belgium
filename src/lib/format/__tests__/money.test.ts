import { describe, expect, it } from "vitest";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDelta,
  formatPerCapita,
  formatPercentage,
  formatPeriod,
} from "../money";

describe("formatCompactCurrency", () => {
  it("formats billions with Belgian-Dutch grouping", () => {
    expect(formatCompactCurrency(706_581_000_000)).toBe("€ 706,6 miljard");
  });

  it("formats millions", () => {
    expect(formatCompactCurrency(645_000_000)).toBe("€ 645,0 miljoen");
  });

  it("never renders scientific/US notation (no 'B' suffix, no thousands dots)", () => {
    expect(formatCompactCurrency(706_581_000_000)).not.toMatch(/\d[A-Za-z]$/);
    expect(formatCompactCurrency(706_581_000_000)).not.toMatch(/e\+/i);
    expect(formatCompactCurrency(706_581_000_000)).not.toContain(".");
  });
});

describe("formatCurrency", () => {
  it("formats the full precision value with dot-grouped thousands", () => {
    expect(formatCurrency(706_581_000_000)).toBe("€ 706.581.000.000");
  });
});

describe("formatPercentage", () => {
  it("uses a comma decimal separator", () => {
    expect(formatPercentage(109.14)).toBe("109,1%");
  });
});

describe("formatPerCapita", () => {
  it("appends 'per inwoner'", () => {
    expect(formatPerCapita(12450)).toBe("€ 12.450 per inwoner");
  });
});

describe("formatDelta", () => {
  it("prefixes positive deltas with +", () => {
    expect(formatDelta(56_484_000_000)).toBe("+€ 56,5 miljard");
  });

  it("prefixes negative deltas with -", () => {
    expect(formatDelta(-3_100_000_000)).toBe("-€ 3,1 miljard");
  });
});

describe("formatPeriod", () => {
  it("formats quarter codes in Dutch", () => {
    expect(formatPeriod("2026-Q1")).toBe("eerste kwartaal 2026");
  });

  it("formats month codes in Dutch", () => {
    expect(formatPeriod("2026-01")).toBe("januari 2026");
  });

  it("passes through year-only labels unchanged", () => {
    expect(formatPeriod("2025")).toBe("2025");
  });
});
