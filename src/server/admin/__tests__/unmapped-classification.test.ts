import { describe, expect, it } from "vitest";
import { classifyUnmapped } from "../unmapped-classification";

describe("classifyUnmapped", () => {
  it("classifies a metric-dimension gap as MISSING_METRIC_MAPPING/WARNING", () => {
    const result = classifyUnmapped({ datasetCode: "gov_10a_main", dimension: "metric", rawValue: "D9" });
    expect(result).toMatchObject({ category: "MISSING_METRIC_MAPPING", severity: "WARNING" });
  });

  it("classifies a unit-dimension gap as MISSING_UNIT_MAPPING/WARNING", () => {
    const result = classifyUnmapped({ datasetCode: "gov_10a_main", dimension: "unit", rawValue: "XDR" });
    expect(result).toMatchObject({ category: "MISSING_UNIT_MAPPING", severity: "WARNING" });
  });

  it("classifies a classification-dimension gap as MISSING_CLASSIFICATION/WARNING", () => {
    const result = classifyUnmapped({ datasetCode: "gov_10a_exp", dimension: "classification", rawValue: "GF99" });
    expect(result).toMatchObject({ category: "MISSING_CLASSIFICATION", severity: "WARNING" });
  });

  it("classifies other-EU-country geo codes on gov_10q_ggdebt as EXPECTED_UNSUPPORTED/INFO", () => {
    for (const rawValue of ["NO", "EA20", "EU27_2020", "DK"]) {
      const result = classifyUnmapped({ datasetCode: "gov_10q_ggdebt", dimension: "entity", rawValue });
      expect(result).toMatchObject({ category: "EXPECTED_UNSUPPORTED", severity: "INFO" });
    }
  });

  it("does not classify Belgium itself as expected-unsupported", () => {
    const result = classifyUnmapped({ datasetCode: "gov_10q_ggdebt", dimension: "entity", rawValue: "BE" });
    expect(result.category).not.toBe("EXPECTED_UNSUPPORTED");
  });

  it("classifies Statbel aggregate NIS codes (ending 000) as EXPECTED_UNSUPPORTED/INFO", () => {
    const result = classifyUnmapped({
      datasetCode: "statbel_population_per_municipality",
      dimension: "entity",
      rawValue: "11000",
      sourceDimensions: { kind: "OTHER_AGGREGATE" },
    });
    expect(result).toMatchObject({ category: "EXPECTED_UNSUPPORTED", severity: "INFO" });
  });

  it("classifies non-000 Statbel NIS codes with no current entity as HISTORICAL_ENTITY/INFO", () => {
    const result = classifyUnmapped({
      datasetCode: "statbel_population_per_municipality",
      dimension: "entity",
      rawValue: "11007",
    });
    expect(result).toMatchObject({ category: "HISTORICAL_ENTITY", severity: "INFO" });
  });

  it("falls back to MISSING_CANONICAL_ENTITY/WARNING for entity gaps on other datasets", () => {
    const result = classifyUnmapped({ datasetCode: "some_new_dataset", dimension: "entity", rawValue: "XX" });
    expect(result).toMatchObject({ category: "MISSING_CANONICAL_ENTITY", severity: "WARNING" });
  });

  it("falls back to UNEXPECTED/WARNING for unrecognised dimensions", () => {
    const result = classifyUnmapped({ datasetCode: "gov_10a_main", dimension: "frequency", rawValue: "M" });
    expect(result).toMatchObject({ category: "UNEXPECTED", severity: "WARNING" });
  });
});
