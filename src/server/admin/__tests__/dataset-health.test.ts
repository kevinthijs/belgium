import { describe, expect, it } from "vitest";
import { computeStaleness, getDatasetHealth } from "../dataset-health";

const DAY = 1000 * 60 * 60 * 24;

describe("computeStaleness", () => {
  it("is not stale when there is no previous successful import (handled elsewhere as NEVER_IMPORTED)", () => {
    const result = computeStaleness("QUARTERLY", null);
    expect(result.isStale).toBe(false);
    expect(result.isWarning).toBe(false);
    expect(result.daysSinceSuccess).toBeNull();
  });

  it("is never time-based-stale for IRREGULAR frequency, no matter how old", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const tenYearsAgo = new Date(now.getTime() - 3650 * DAY);
    const result = computeStaleness("IRREGULAR", tenYearsAgo, now);
    expect(result.isStale).toBe(false);
    expect(result.isWarning).toBe(false);
    expect(result.staleAfterDays).toBeNull();
  });

  it("flags a quarterly dataset as stale after 120 days", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const justOver = new Date(now.getTime() - 121 * DAY);
    const result = computeStaleness("QUARTERLY", justOver, now);
    expect(result.isStale).toBe(true);
    expect(result.staleAfterDays).toBe(120);
  });

  it("does not flag a quarterly dataset as stale at exactly the threshold", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exact = new Date(now.getTime() - 120 * DAY);
    const result = computeStaleness("QUARTERLY", exact, now);
    expect(result.isStale).toBe(false);
  });

  it("uses a different threshold for annual vs. monthly datasets", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);

    // 200 days is well past "stale" for a monthly dataset, but well within
    // range for an annual one — cadence-specific thresholds, not one global rule.
    expect(computeStaleness("MONTHLY", daysAgo(200), now).isStale).toBe(true);
    expect(computeStaleness("ANNUAL", daysAgo(200), now).isStale).toBe(false);
  });

  it("enters the warning zone at 75% of the stale threshold", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    // MONTHLY stale-after = 45 days, warning-after = round(45 * 0.75) = 34
    const result = computeStaleness("MONTHLY", new Date(now.getTime() - 40 * DAY), now);
    expect(result.isWarning).toBe(true);
    expect(result.isStale).toBe(false);
  });
});

describe("getDatasetHealth", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const baseInput = {
    isEnabled: true,
    frequency: "QUARTERLY" as const,
    lastCheckedAt: now,
    lastImportRun: { status: "SUCCESS" as const, startedAt: now, completedAt: now },
    lastSuccessfulImportAt: now,
    latestRunRejectedCount: 0,
    unmappedSinceLastSuccessCount: 0,
    now,
  };

  it("is NEVER_IMPORTED when there is no successful import, regardless of other fields", () => {
    const result = getDatasetHealth({ ...baseInput, lastSuccessfulImportAt: null, lastImportRun: null });
    expect(result.state).toBe("NEVER_IMPORTED");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("is FAILED when the most recent import attempt failed, even if an earlier import succeeded", () => {
    const result = getDatasetHealth({
      ...baseInput,
      lastImportRun: { status: "FAILED", startedAt: now, completedAt: now },
    });
    expect(result.state).toBe("FAILED");
  });

  it("is STALE when the last success is older than the frequency-specific threshold", () => {
    const longAgo = new Date(now.getTime() - 200 * DAY);
    const result = getDatasetHealth({ ...baseInput, lastSuccessfulImportAt: longAgo });
    expect(result.state).toBe("STALE");
  });

  it("STALE takes precedence over a merely-disabled dataset", () => {
    const longAgo = new Date(now.getTime() - 200 * DAY);
    const result = getDatasetHealth({ ...baseInput, isEnabled: false, lastSuccessfulImportAt: longAgo });
    expect(result.state).toBe("STALE");
  });

  it("is WARNING when disabled but otherwise healthy and fresh", () => {
    const result = getDatasetHealth({ ...baseInput, isEnabled: false });
    expect(result.state).toBe("WARNING");
    expect(result.reasons.some((r) => r.includes("uitgeschakeld"))).toBe(true);
  });

  it("is WARNING when the latest run rejected records", () => {
    const result = getDatasetHealth({ ...baseInput, latestRunRejectedCount: 5 });
    expect(result.state).toBe("WARNING");
  });

  it("is WARNING when there are unresolved unmapped values since the last success", () => {
    const result = getDatasetHealth({ ...baseInput, unmappedSinceLastSuccessCount: 3 });
    expect(result.state).toBe("WARNING");
  });

  it("is WARNING when the last run was only a partial success", () => {
    const result = getDatasetHealth({ ...baseInput, lastImportRun: { status: "PARTIAL_SUCCESS", startedAt: now, completedAt: now } });
    expect(result.state).toBe("WARNING");
  });

  it("is HEALTHY when enabled, fresh, and free of rejections/unmapped values", () => {
    const result = getDatasetHealth(baseInput);
    expect(result.state).toBe("HEALTHY");
    expect(result.reasons).toHaveLength(0);
  });

  it("stays HEALTHY no matter how large the routine (INFO-severity) unmapped backlog is, since callers must pass only the non-routine count", () => {
    // getDatasetHealth trusts its caller to have already excluded
    // EXPECTED_UNSUPPORTED/HISTORICAL_ENTITY (severity INFO) rows from
    // unmappedSinceLastSuccessCount — see overview.ts/datasets.ts, which
    // pass `unexpectedUnmappedCount` (severity !== INFO), not the raw count.
    // A dataset with thousands of routine expected-unsupported rows must
    // still read HEALTHY once that filtering has happened upstream.
    const result = getDatasetHealth({ ...baseInput, unmappedSinceLastSuccessCount: 0 });
    expect(result.state).toBe("HEALTHY");
  });

  it("mentions that routine values don't count, in the WARNING reason text", () => {
    const result = getDatasetHealth({ ...baseInput, unmappedSinceLastSuccessCount: 7 });
    expect(result.state).toBe("WARNING");
    expect(result.reasons.some((r) => r.includes("routinematig"))).toBe(true);
  });
});
