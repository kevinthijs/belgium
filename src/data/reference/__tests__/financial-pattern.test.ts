import { describe, expect, it } from "vitest";
import {
  balanceReconciliation, debtBridge, expenditureCategories, financialCountries, financialLatestYear, financialMetric, flowBalance,
  financialObservation, financialOutlook, financialValue, financialYears, forecastValue, guaranteeAmount,
  guaranteesYear, historicalValue, incomeCategories, socialAmount, socialCategories, socialLatestYear,
  socialYears, withReconciliation,
} from "../financial-pattern";

describe("complete government accounts", () => {
  it("uses populated common periods and preserves missing observations", () => {
    expect(financialLatestYear).toBe("2025");
    expect(financialYears[0]).toBe("2015");
    expect(socialLatestYear).toBe("2024");
    expect(guaranteesYear).toBe("2024");
    expect(financialObservation("social", { geo: "BE", time: "2025", cofog99: "GF10", unit: "MIO_EUR" }).value).toBeNull();
    expect(financialMetric("XX", "revenue", "2025").value).toBeNull();
  });

  it("closes the calculated account while preserving discrepancies with the reported balance", () => {
    for (const year of financialYears) for (const country of financialCountries) {
      const revenue = financialMetric(country.code, "revenue", year).value!;
      const expenditure = financialMetric(country.code, "expenditure", year).value!;
      expect(revenue - expenditure).toBeCloseTo(flowBalance(country.code, year).value!, 0);
      expect(balanceReconciliation(country.code, year).value).toBeCloseTo(revenue - expenditure - financialMetric(country.code, "balance", year).value!, 0);
      expect(financialMetric(country.code, "primary", year).value).toBeCloseTo(financialMetric(country.code, "balance", year).value! + financialMetric(country.code, "interest", year).value!, 2);
    }
    expect(financialMetric("BE", "revenue", "2025").value).toBe(315_402_600_000);
    expect(financialMetric("BE", "expenditure", "2025").value).toBe(348_825_500_000);
    expect(balanceReconciliation("BE", "2025").value).toBe(200_000);
  });

  it("reconciles economic categories without concealing a source discrepancy", () => {
    for (const country of financialCountries) {
      const total = financialMetric(country.code, "expenditure", "2025");
      const categories = withReconciliation(expenditureCategories(country.code, "2025"), total);
      expect(categories.reduce((sum, item) => sum + item.amount.value!, 0)).toBeCloseTo(total.value!, 2);
      const income = withReconciliation(incomeCategories(country.code, "2025"), financialMetric(country.code, "revenue", "2025"));
      expect(income.reduce((sum, item) => sum + item.amount.value!, 0)).toBeCloseTo(financialMetric(country.code, "revenue", "2025").value!, 2);
    }
    const belgium = withReconciliation(expenditureCategories("BE", "2025"), financialMetric("BE", "expenditure", "2025"));
    expect(belgium.find((item) => item.key === "reconciliation")!.amount.value).toBeCloseTo(-4_000_000, 0);
    expect(withReconciliation([{ key: "missing", label: "Missing", definition: "", amount: { value: null, status: "m" } }], { value: 100, status: "" }).at(-1)!.amount.value).toBeNull();
  });

  it("uses the whole-economy GDP and same-year population denominators", () => {
    const revenue = financialMetric("BE", "revenue", "2025");
    expect(financialObservation("gdp", { geo: "BE", time: "2025" }).value).toBe(640852.6);
    expect(financialValue(revenue, "BE", "2025", "gdp").value).toBeCloseTo(315402.6 / 640852.6 * 100);
    expect(financialValue(revenue, "BE", "2025", "resident").value).toBeCloseTo(315_402_600_000 / 11_919_402);
    expect(financialValue(revenue, "BE", "2025", "resident").status).toContain("p");
    for (const country of financialCountries) for (const year of financialYears) {
      expect(financialValue(financialMetric(country.code, "expenditure", year), country.code, year, "gdp").value).toBeGreaterThan(0);
    }
  });

  it("keeps social detail within its parent function", () => {
    for (const country of financialCountries) for (const year of socialYears) {
      const parts = socialCategories.map((item) => socialAmount(country.code, item.code, year).value);
      expect(parts.every((value) => value !== null)).toBe(true);
      const total = socialAmount(country.code, "GF10", year).value!;
      expect(Math.abs(parts.reduce((sum: number, value) => sum + value!, 0) - total)).toBeLessThanOrEqual(500_001);
    }
  });

  it("closes debt changes including surpluses, rather than equating every change with the deficit", () => {
    for (const country of financialCountries) for (const year of financialYears) {
      const bridge = debtBridge(country.code, year);
      expect(bridge.start.value! + bridge.borrowing.value! + bridge.adjustment.value!).toBeCloseTo(bridge.end.value!, 2);
    }
    expect(debtBridge("BE", "2025").adjustment.value).toBe(15_381_400_000);
    expect(debtBridge("NL", "2019").borrowing.value).toBeLessThan(0);
  });

  it("applies price correction only to monetary values and preserves the base year", () => {
    const base = financialYears[0]!;
    expect(historicalValue("BE", "expenditure", base, "resident", true)).toEqual(historicalValue("BE", "expenditure", base, "resident", false));
    expect(historicalValue("BE", "expenditure", "2025", "resident", true).value).toBeLessThan(historicalValue("BE", "expenditure", "2025", "resident", false).value!);
    expect(historicalValue("BE", "expenditure", "2025", "gdp", true)).toEqual(historicalValue("BE", "expenditure", "2025", "gdp", false));
    expect(historicalValue("BE", "social:GF1002", "2024", "total", false)).toEqual(socialAmount("BE", "GF1002", "2024"));
    expect(historicalValue("BE", "social:GF1002", "2025", "total", false).value).toBeNull();
    expect(historicalValue("BE", "unknown", "2025", "total", false).value).toBeNull();
  });

  it("keeps historical forecasts, guarantees and long-term scenarios separate from realised accounts", () => {
    expect(forecastValue("BE", "balance")).toBe(-4.9);
    expect(forecastValue("NL", "debt")).toBe(44.3);
    expect(financialOutlook.forecast.targetYear).toBe("2025");
    for (const country of financialCountries) {
      expect(guaranteeAmount(country.code).value).toBeGreaterThanOrEqual(0);
      for (const metric of Object.values(financialOutlook.ageing.metrics)) {
        const values = metric.values[country.code as keyof typeof metric.values];
        expect(values["2022"]).toBeGreaterThan(0);
        expect(values["2070"]).toBeGreaterThan(0);
      }
    }
  });
});
