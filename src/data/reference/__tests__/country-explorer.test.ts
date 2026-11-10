import { describe, expect, it } from "vitest";
import geography from "../europe-country-map.json";
import { explorerCountries, explorerMetrics, explorerObservation, explorerValues } from "../country-explorer";

describe("country explorer source coverage", () => {
  it("has reviewed data for all topics, units and five countries", () => {
    expect(explorerMetrics).toHaveLength(7);
    for (const metric of explorerMetrics) {
      for (const unit of ["gdp", "euro", "pps"] as const) {
        const values = explorerValues(metric.key, unit);
        expect(values).toHaveLength(5);
        for (const observation of values) expect(Number.isFinite(observation.value)).toBe(true);
      }
    }
    expect(explorerObservation("BE", "administration").value).toBe(2);
    expect(explorerObservation("FR", "administration").value).toBe(1.5);
  });

  it("keeps population shares independent of the financial unit", () => {
    for (const metric of ["age", "employment", "care"] as const) {
      expect(explorerValues(metric, "euro")).toEqual(explorerValues(metric, "gdp"));
    }
  });

  it("includes real boundaries and visible anchors for each selectable country", () => {
    for (const country of explorerCountries) {
      const features = geography.features.filter((feature) => feature.code === country.code);
      expect(features).toHaveLength(1);
      expect(features[0].path).toMatch(/^M/);
      const points = geography.labels[country.code as keyof typeof geography.labels];
      for (const [x, y] of [points.anchor, points.label]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(geography.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(geography.height);
      }
    }
  });
});
