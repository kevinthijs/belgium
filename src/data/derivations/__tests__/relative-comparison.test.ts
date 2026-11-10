import { describe, expect, it } from "vitest";
import { compareCountryValues } from "../relative-comparison";

describe("country differences", () => {
  it("distinguishes percentage points from the relative percentage", () => {
    expect(compareCountryValues(1.5, 2)).toEqual({ difference: -0.5, relativePercent: -25 });
    expect(compareCountryValues(2, 1.5)?.relativePercent).toBeCloseTo(100 / 3);
  });

  it("uses the chosen reference as the denominator", () => {
    expect(compareCountryValues(20, 10)).toEqual({ difference: 10, relativePercent: 100 });
    expect(compareCountryValues(10, 20)).toEqual({ difference: -10, relativePercent: -50 });
    expect(compareCountryValues(0, 20)).toEqual({ difference: -20, relativePercent: -100 });
  });

  it("keeps zero references undefined and missing observations missing", () => {
    expect(compareCountryValues(10, 0)).toEqual({ difference: 10, relativePercent: null });
    for (const missing of [null, NaN, Infinity, -Infinity]) {
      expect(compareCountryValues(missing, 2)).toBeNull();
      expect(compareCountryValues(2, missing)).toBeNull();
    }
  });
});
