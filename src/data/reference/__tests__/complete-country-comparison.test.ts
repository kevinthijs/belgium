import { describe, expect, it } from "vitest";
import snapshot from "../complete-country-comparison-snapshot.json";
import { completeComparisonCountries, costMetrics, costObservation, costTotal, contextMetrics, contextObservation, observationNote, outcomeMetrics, outcomeObservation, realCostPerResident, sourceObservation, trendObservation, type CompleteCountryCode } from "../complete-country-comparison";

describe("harmonized five-country comparison", () => {
  it("resolves country, sector, function, item, year and units independently of dimension ordering", () => {
    expect(sourceObservation("spending", { geo: "BE", time: "2024", unit: "MIO_EUR", cofog99: "GF0101", na_item: "TE" })).toEqual({ value: 12689.3, status: "p" });
    expect(sourceObservation("spending", { geo: "FR", time: "2024", unit: "MIO_EUR", cofog99: "GF0101", na_item: "D1" }).value).toBe(12532.7);
    expect(sourceObservation("spending", { geo: "NL", time: "2024", unit: "MIO_EUR", cofog99: "GF0101", na_item: "TE" }).value).toBe(22816);
    expect(costTotal("BE", "administration").value).toBe(12_689_300_000);
    expect(sourceObservation("spending", { geo: "UNKNOWN", time: "2024", unit: "MIO_EUR", cofog99: "GF0101", na_item: "TE" }).value).toBeNull();
    expect(() => sourceObservation("spending", { geo: "BE" })).toThrow("Missing dimension filter");
  });

  it("uses the same-year average population and the GDP PPP with the right direction", () => {
    const euros = costObservation("BE", "administration").value!;
    expect(euros).toBeCloseTo(12_689_300_000 / 11_850_296, 6);
    expect(costObservation("BE", "administration", "pps").value).toBeCloseTo(euros / 1.12256, 6);
    expect(costObservation("BE", "administration", "gdp").value).toBe(2);
    expect(costObservation("UNKNOWN", "administration").value).toBeNull();
    expect(() => costObservation("BE", "administration", "pps", 2019)).toThrow("reference year");
  });

  it("anchors every country at 100 and corrects consumer prices in the right direction", () => {
    for (const country of completeComparisonCountries) {
      expect(trendObservation(country.code, 2019, "real").value).toBeCloseTo(100, 8);
      expect(trendObservation(country.code, 2019, "nominal").value).toBeCloseTo(100, 8);
      const nominal = costObservation(country.code, "administration").value!;
      const initialHicp = sourceObservation("hicp", { geo: country.code, time: "2019" }).value!;
      const lastHicp = sourceObservation("hicp", { geo: country.code, time: "2024" }).value!;
      expect(realCostPerResident(country.code, 2024).value).toBeCloseTo(nominal * initialHicp / lastHicp, 6);
      expect(trendObservation(country.code, 2024, "real").value!).toBeLessThan(trendObservation(country.code, 2024, "nominal").value!);
    }
  });

  it("has complete observations for every published country, metric and trend year", () => {
    expect(completeComparisonCountries.map((country) => country.code)).toEqual(["BE", "FR", "NL", "DE", "ES"]);
    for (const country of completeComparisonCountries) {
      for (const metric of costMetrics) for (const unit of ["euro", "pps", "gdp"] as const) expect(costObservation(country.code, metric.key, unit).value).not.toBeNull();
      for (const metric of contextMetrics) expect(contextObservation(country.code, metric.key).value).not.toBeNull();
      for (const metric of outcomeMetrics) expect(outcomeObservation(country.code as CompleteCountryCode, metric.key).value).not.toBeNull();
      for (const year of snapshot.trendYears) expect(trendObservation(country.code, year).value).not.toBeNull();
    }
  });

  it("keeps survey age bands, reasons, confidence caveats and source flags visible", () => {
    expect(snapshot.sources.care.data.dimension.age.category.index).toEqual({ Y_GE16: 0 });
    expect(snapshot.sources.care.data.dimension.reason.category.index).toEqual({ TXP_TFAR_WLIST: 0 });
    expect(snapshot.sources.employment.data.dimension.age.category.index).toEqual({ "Y20-64": 0 });
    expect(outcomeObservation("NL", "math")).toEqual({ value: 493, status: "s" });
    expect(observationNote("s")).toContain("steekproefnormen");
    expect(contextObservation("FR", "employment").status).toContain("d");
    expect(observationNote("d")).toContain("Afwijkende definitie");
    expect(sourceObservation("ppp", { geo: "BE" }).value).toBe(1.12256);
    expect(snapshot.sources.ppp.data.dimension.ppp_cat.category.index).toEqual({ GDP: 0 });
  });
});
