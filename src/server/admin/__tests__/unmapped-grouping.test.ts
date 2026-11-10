import { describe, expect, it } from "vitest";
import { sortUnmappedByOccurrence, type UnmappedGroup } from "../unmapped-grouping";

function group(overrides: Partial<UnmappedGroup>): UnmappedGroup {
  return {
    datasetCode: "ds",
    dimension: "geo",
    rawValue: "XX",
    category: "UNEXPECTED",
    severity: "WARNING",
    latestStatus: "OPEN",
    occurrenceCount: 1,
    firstDetectedAt: new Date(),
    lastDetectedAt: new Date(),
    sampleContext: null,
    resolvedCount: 0,
    ...overrides,
  };
}

describe("sortUnmappedByOccurrence", () => {
  it("orders groups by occurrenceCount, highest first", () => {
    const groups = [group({ rawValue: "a", occurrenceCount: 2 }), group({ rawValue: "b", occurrenceCount: 50 }), group({ rawValue: "c", occurrenceCount: 10 })];
    const sorted = sortUnmappedByOccurrence(groups);
    expect(sorted.map((g) => g.rawValue)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const groups = [group({ rawValue: "a", occurrenceCount: 1 }), group({ rawValue: "b", occurrenceCount: 5 })];
    const original = [...groups];
    sortUnmappedByOccurrence(groups);
    expect(groups).toEqual(original);
  });

  it("returns an empty array unchanged", () => {
    expect(sortUnmappedByOccurrence([])).toEqual([]);
  });
});
