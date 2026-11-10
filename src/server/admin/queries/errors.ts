import "server-only";
import { prisma } from "@/lib/prisma";
import { isImportRunError } from "../import-run-helpers";

export interface ImportRunError {
  importRunId: string;
  datasetCode: string;
  datasetName: string;
  startedAt: Date;
  status: string;
  recordsRejected: number;
  errors: unknown;
  warnings: unknown;
}

/**
 * "Errors" here means actual failed/partially-failed ImportRuns (status
 * FAILED, or PARTIAL_SUCCESS with rejected records) — not the generic
 * unmapped-value backlog, which has its own /admin/data/unmapped page and
 * is routine, not an error.
 */
export async function getImportErrors(datasetId?: string): Promise<ImportRunError[]> {
  const runs = await prisma.importRun.findMany({
    where: {
      ...(datasetId ? { datasetId } : {}),
      OR: [{ status: "FAILED" }, { recordsRejected: { gt: 0 } }],
    },
    include: { dataset: true },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  return runs
    .filter(isImportRunError)
    .map((run) => ({
      importRunId: run.id,
      datasetCode: run.dataset.code,
      datasetName: run.dataset.name,
      startedAt: run.startedAt,
      status: run.status,
      recordsRejected: run.recordsRejected,
      errors: run.errors,
      warnings: run.warnings,
    }));
}
