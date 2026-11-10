import type { ImportRunStatus } from "@/generated/prisma";

/** Most recent import attempt, regardless of outcome. Runs must already be
 * ordered `startedAt desc` — this only picks the first element so the
 * "most recent" semantics live in one place instead of being re-implemented
 * ad hoc wherever a dataset's import history is loaded. */
export function selectLastAttempt<T>(runsOrderedByStartedAtDesc: T[]): T | null {
  return runsOrderedByStartedAtDesc[0] ?? null;
}

/** The most recent import run that actually produced usable data (SUCCESS or
 * PARTIAL_SUCCESS). This is what "last successful import" means throughout
 * the admin dashboard — a FAILED or RUNNING run never counts, even if it's
 * more recent than the last real success. */
export function selectLastSuccessfulRun<T extends { status: ImportRunStatus }>(runsOrderedByStartedAtDesc: T[]): T | null {
  return runsOrderedByStartedAtDesc.find((r) => r.status === "SUCCESS" || r.status === "PARTIAL_SUCCESS") ?? null;
}

/** An import run counts as an "error" on /admin/data/errors when it failed
 * outright, or when it partially succeeded but rejected at least one record.
 * A plain SUCCESS with zero rejections is never an error, even if it also
 * produced warnings. */
export function isImportRunError(run: { status: ImportRunStatus; recordsRejected: number }): boolean {
  return run.status === "FAILED" || run.recordsRejected > 0;
}

/** Sums created/updated/rejected counts across a set of import runs. Used
 * wherever a lightweight in-memory summary is needed for a small, already
 * loaded batch of runs (large/unbounded sets should use a DB-side
 * aggregate instead, e.g. `prisma.importRun.aggregate`). */
export function sumImportRunCounts(runs: { recordsCreated: number; recordsUpdated: number; recordsRejected: number }[]): {
  created: number;
  updated: number;
  rejected: number;
} {
  return runs.reduce(
    (acc, run) => ({
      created: acc.created + run.recordsCreated,
      updated: acc.updated + run.recordsUpdated,
      rejected: acc.rejected + run.recordsRejected,
    }),
    { created: 0, updated: 0, rejected: 0 },
  );
}
