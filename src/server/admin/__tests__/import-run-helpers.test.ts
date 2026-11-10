import { describe, expect, it } from "vitest";
import { isImportRunError, selectLastAttempt, selectLastSuccessfulRun, sumImportRunCounts } from "../import-run-helpers";

describe("selectLastAttempt", () => {
  it("returns the first run (callers must already order by startedAt desc)", () => {
    const runs = [{ id: "b" }, { id: "a" }];
    expect(selectLastAttempt(runs)).toEqual({ id: "b" });
  });

  it("returns null for an empty history — a dataset that was never attempted", () => {
    expect(selectLastAttempt([])).toBeNull();
  });
});

describe("selectLastSuccessfulRun", () => {
  it("skips a more recent FAILED run to find the last real success", () => {
    const runs = [
      { id: "latest-failed", status: "FAILED" as const },
      { id: "prior-success", status: "SUCCESS" as const },
    ];
    expect(selectLastSuccessfulRun(runs)?.id).toBe("prior-success");
  });

  it("treats PARTIAL_SUCCESS as a valid successful import", () => {
    const runs = [{ id: "partial", status: "PARTIAL_SUCCESS" as const }];
    expect(selectLastSuccessfulRun(runs)?.id).toBe("partial");
  });

  it("returns null when a dataset has never had a successful import", () => {
    const runs = [
      { id: "a", status: "FAILED" as const },
      { id: "b", status: "RUNNING" as const },
    ];
    expect(selectLastSuccessfulRun(runs)).toBeNull();
  });
});

describe("isImportRunError", () => {
  it("counts a FAILED run as an error even with zero rejected records", () => {
    expect(isImportRunError({ status: "FAILED", recordsRejected: 0 })).toBe(true);
  });

  it("counts a run with rejected records as an error even if it otherwise succeeded", () => {
    expect(isImportRunError({ status: "PARTIAL_SUCCESS", recordsRejected: 3 })).toBe(true);
  });

  it("does not count a clean SUCCESS as an error", () => {
    expect(isImportRunError({ status: "SUCCESS", recordsRejected: 0 })).toBe(false);
  });
});

describe("sumImportRunCounts", () => {
  it("sums created/updated/rejected across multiple runs", () => {
    const runs = [
      { recordsCreated: 10, recordsUpdated: 2, recordsRejected: 1 },
      { recordsCreated: 5, recordsUpdated: 0, recordsRejected: 0 },
    ];
    expect(sumImportRunCounts(runs)).toEqual({ created: 15, updated: 2, rejected: 1 });
  });

  it("returns all zeros for an empty list", () => {
    expect(sumImportRunCounts([])).toEqual({ created: 0, updated: 0, rejected: 0 });
  });
});
