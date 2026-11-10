import { describe, expect, it } from "vitest";
import { localGovernmentCountries, localGovernmentRatios, localGovernmentRelativeRatios, publicEmploymentComparison } from "../local-government-comparison";

describe("Belgian and French government comparison denominators", () => {
  it("keeps percentages distinct from posts per 100,000 residents", () => {
    const [belgium, france] = localGovernmentCountries.map(localGovernmentRatios);
    expect(belgium!.per100000Residents).toBeCloseTo(4.77779, 5);
    expect(france!.per100000Residents).toBeCloseTo(50.83375, 5);
    expect(belgium!.percentOfPopulation).toBeCloseTo(0.00477779, 8);
    expect(france!.percentOfPopulation).toBeCloseTo(0.05083375, 8);
    expect(belgium!.residentsPerMayor).toBeCloseTo(20_930.18, 2);
    expect(france!.residentsPerMayor).toBeCloseTo(1_967.20, 2);
  });

  it("normalizes municipal posts by area and population separately", () => {
    const [belgium, france] = localGovernmentCountries.map(localGovernmentRatios);
    expect(belgium!.per1000Km2).toBeCloseTo(18.4105, 4);
    expect(france!.per1000Km2).toBeCloseTo(55.0948, 4);
    expect(localGovernmentRelativeRatios.perResident).toBeCloseTo(10.6396, 4);
    expect(localGovernmentRelativeRatios.perArea).toBeCloseTo(2.9926, 4);
  });

  it("distinguishes percentage points from the relative employment difference", () => {
    expect(publicEmploymentComparison.belgiumPercent).toBe(18.33);
    expect(publicEmploymentComparison.francePercent).toBe(20.74);
    expect(publicEmploymentComparison.percentagePointGap).toBeCloseTo(2.41, 2);
    expect(publicEmploymentComparison.relativeGapPercent).toBeCloseTo(13.1478, 4);
    expect(publicEmploymentComparison.belgiumOneIn).toBeCloseTo(5.4555, 4);
    expect(publicEmploymentComparison.franceOneIn).toBeCloseTo(4.8216, 4);
  });
});
