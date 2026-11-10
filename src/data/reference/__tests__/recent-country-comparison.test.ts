import { describe, expect, it } from "vitest";
import {
  natoBudget2026, natoIndicative, recentCountries, recentObservation, recentTaxObservation,
  transportYear, unemploymentPeriod, vatBreakdown, vatYear,
} from "../recent-country-comparison";
import { explorerMetrics, explorerObservation, explorerPeriod } from "../country-explorer";
import { compareCountryValues } from "../../derivations/relative-comparison";

describe("recent comparable country statistics", () => {
  it("selects the latest populated common period, skipping empty future periods", () => {
    expect(vatYear).toBe("2025");
    expect(transportYear).toBe("2024");
    expect(unemploymentPeriod).toBe("2026-09");
    expect(recentObservation("unemployment", { geo: "BE", time: "2026-10" }).value).toBeNull();
    expect(recentTaxObservation("XX", "vat", "total").value).toBeNull();
  });

  it("reconciles VAT totals and same-year population denominators", () => {
    expect(recentTaxObservation("BE", "vat", "total").value).toBe(39_796_600_000);
    expect(recentTaxObservation("BE", "vat", "gdp").value).toBe(6.2);
    expect(recentTaxObservation("BE", "vat", "resident").value).toBeCloseTo(39_796_600_000 / 11_919_402);
    expect(recentTaxObservation("BE", "vat", "resident").status).toContain("p");
    for (const country of recentCountries) {
      for (const source of ["vat", "transport"] as const) {
        for (const unit of ["total", "resident", "gdp"] as const) {
          expect(recentTaxObservation(country.code, source, unit).value).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps unemployment denominators and percentage comparisons distinct", () => {
    const rates = ["BE", "FR", "NL", "DE", "ES"].map((geo) => recentObservation("unemployment", { geo, time: unemploymentPeriod }).value);
    expect(rates).toEqual([6, 8.5, 4, 4.1, 10.3]);
    expect(compareCountryValues(rates[1]!, rates[0]!)?.difference).toBe(2.5);
    expect(compareCountryValues(rates[1]!, rates[0]!)?.relativePercent).toBeCloseTo(41.6666667);
    const metric = explorerMetrics.find((item) => item.key === "unemployment")!;
    expect(explorerPeriod(metric)).toBe("september 2026");
    expect(explorerObservation("BE", "unemployment").value).toBe(6);
  });

  it("labels transport receipts with their broader statistical scope", () => {
    expect(recentTaxObservation("BE", "transport", "total").value).toBe(3_406_400_000);
    expect(recentTaxObservation("BE", "transport", "resident").value).toBeCloseTo(3_406_400_000 / 11_850_296);
    expect(explorerMetrics.find((item) => item.key === "transportTaxes")!.definition).toContain("brandstofaccijnzen");
  });

  it("calculates an indicative NATO allocation from the published budget components", () => {
    const budget = natoBudget2026.civilEUR + natoBudget2026.militaryEUR + natoBudget2026.investmentCeilingEUR;
    expect(budget).toBe(5_148_200_000);
    const belgium = natoIndicative("BE");
    expect(belgium.total).toBeCloseTo(budget * 2.0716 / 100);
    expect(belgium.total).toBeCloseTo(belgium.civil + belgium.military + belgium.investment);
    expect(natoBudget2026.shareValidFrom).toBe("2026-01-01");
  });
});

describe("VAT on consumer prices", () => {
  it("extracts VAT from a gross price rather than multiplying the gross price by the rate", () => {
    expect(vatBreakdown(121, 21, true)).toEqual({ net: 100, vat: 21, gross: 121 });
    expect(vatBreakdown(106, 6, true)).toEqual({ net: 100, vat: 6, gross: 106 });
    expect(vatBreakdown(100, 12, false)).toEqual({ net: 100, vat: 12, gross: 112 });
    expect(vatBreakdown(100, 0, true)).toEqual({ net: 100, vat: 0, gross: 100 });
    expect(vatBreakdown(0, 21, true)).toEqual({ net: 0, vat: 0, gross: 0 });
  });

  it("rejects invalid prices without converting missing inputs into receipts", () => {
    expect(vatBreakdown(-1, 21, true)).toBeNull();
    expect(vatBreakdown(NaN, 21, true)).toBeNull();
    expect(vatBreakdown(Infinity, 21, true)).toBeNull();
    expect(vatBreakdown(100, -1, true)).toBeNull();
  });
});
