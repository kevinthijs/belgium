import "server-only";
import { prisma } from "@/lib/prisma";
import { getDatasetHealth, type HealthState } from "../dataset-health";
import { selectLastAttempt, selectLastSuccessfulRun } from "../import-run-helpers";
import type { DataFrequency, ImportRunStatus } from "@/generated/prisma";

export interface DatasetHealthRow {
  id: string;
  organisationName: string;
  organisationCode: string;
  code: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  frequency: DataFrequency;
  lastCheckedAt: Date | null;
  lastSuccessfulImportAt: Date | null;
  lastAttemptAt: Date | null;
  lastAttemptStatus: ImportRunStatus | null;
  latestAvailablePeriod: string | null;
  observationCount: number;
  createdCount: number;
  updatedCount: number;
  rejectedCount: number;
  unmappedCount: number;
  /** Open unmapped rows that are NOT routine (severity above INFO) — i.e.
   * excludes EXPECTED_UNSUPPORTED/HISTORICAL_ENTITY. This, not the raw
   * `unmappedCount`, is what should ever push a dataset's health out of
   * HEALTHY: a dataset can have thousands of expected-unsupported rows and
   * still be perfectly healthy. */
  unexpectedUnmappedCount: number;
  revisionCount: number;
  health: ReturnType<typeof getDatasetHealth>;
}

/** Central per-dataset health/stat aggregation, reused by the overview,
 * dataset table and dataset detail pages so all three agree with each
 * other. */
export async function getDatasetHealthRows(): Promise<DatasetHealthRow[]> {
  const datasets = await prisma.sourceDataset.findMany({
    include: {
      organisation: true,
      importRuns: { orderBy: { startedAt: "desc" }, take: 20 },
      _count: { select: { observations: true } },
    },
    orderBy: [{ organisation: { name: "asc" } }, { code: "asc" }],
  });

  const now = new Date();

  const rows = await Promise.all(
    datasets.map(async (dataset) => {
      const lastAttempt = selectLastAttempt(dataset.importRuns);
      const lastSuccess = selectLastSuccessfulRun(dataset.importRuns);

      const [createdSum, updatedSum, rejectedSum, unmappedCount, unexpectedUnmappedCount, revisionCount] = await Promise.all([
        prisma.importRun.aggregate({ where: { datasetId: dataset.id }, _sum: { recordsCreated: true } }),
        prisma.importRun.aggregate({ where: { datasetId: dataset.id }, _sum: { recordsUpdated: true } }),
        prisma.importRun.aggregate({ where: { datasetId: dataset.id }, _sum: { recordsRejected: true } }),
        prisma.unmappedSourceValue.count({
          where: {
            importRun: { datasetId: dataset.id },
            resolvedAt: null,
            ...(lastSuccess ? { detectedAt: { gte: lastSuccess.startedAt } } : {}),
          },
        }),
        prisma.unmappedSourceValue.count({
          where: {
            importRun: { datasetId: dataset.id },
            resolvedAt: null,
            severity: { not: "INFO" },
            ...(lastSuccess ? { detectedAt: { gte: lastSuccess.startedAt } } : {}),
          },
        }),
        prisma.observationRevision.count({ where: { importRun: { datasetId: dataset.id } } }),
      ]);

      const health = getDatasetHealth({
        isEnabled: dataset.isEnabled,
        frequency: dataset.frequency,
        lastCheckedAt: dataset.lastCheckedAt,
        lastImportRun: lastAttempt
          ? { status: lastAttempt.status, startedAt: lastAttempt.startedAt, completedAt: lastAttempt.completedAt }
          : null,
        lastSuccessfulImportAt: lastSuccess?.completedAt ?? null,
        latestRunRejectedCount: lastAttempt?.recordsRejected ?? 0,
        unmappedSinceLastSuccessCount: unexpectedUnmappedCount,
        now,
      });

      const row: DatasetHealthRow = {
        id: dataset.id,
        organisationName: dataset.organisation.name,
        organisationCode: dataset.organisation.code,
        code: dataset.code,
        name: dataset.name,
        description: dataset.description,
        isEnabled: dataset.isEnabled,
        frequency: dataset.frequency,
        lastCheckedAt: dataset.lastCheckedAt,
        lastSuccessfulImportAt: lastSuccess?.completedAt ?? null,
        lastAttemptAt: lastAttempt?.startedAt ?? null,
        lastAttemptStatus: lastAttempt?.status ?? null,
        latestAvailablePeriod: dataset.latestAvailablePeriod,
        observationCount: dataset._count.observations,
        createdCount: createdSum._sum.recordsCreated ?? 0,
        updatedCount: updatedSum._sum.recordsUpdated ?? 0,
        rejectedCount: rejectedSum._sum.recordsRejected ?? 0,
        unmappedCount,
        unexpectedUnmappedCount,
        revisionCount,
        health,
      };
      return row;
    }),
  );

  return rows;
}

export interface AdminOverviewSummary {
  sourceCount: number;
  datasetCount: number;
  observationCount: number;
  latestImportAt: Date | null;
  unmappedCount: number;
  revisionCount: number;
  failedRecordsCount: number;
  healthCounts: Record<HealthState, number>;
  datasets: DatasetHealthRow[];
}

export async function getAdminOverview(): Promise<AdminOverviewSummary> {
  const datasets = await getDatasetHealthRows();

  const [sourceCount, observationCount, latestImport, unmappedCount, revisionCount, failedRecordsAgg] = await Promise.all([
    prisma.sourceOrganisation.count(),
    prisma.observation.count(),
    prisma.importRun.findFirst({ orderBy: { startedAt: "desc" }, select: { startedAt: true, completedAt: true } }),
    prisma.unmappedSourceValue.count({ where: { resolvedAt: null } }),
    prisma.observationRevision.count(),
    prisma.importRun.aggregate({ _sum: { recordsRejected: true } }),
  ]);

  const healthCounts: Record<HealthState, number> = {
    HEALTHY: 0,
    WARNING: 0,
    STALE: 0,
    FAILED: 0,
    NEVER_IMPORTED: 0,
  };
  for (const d of datasets) healthCounts[d.health.state]++;

  return {
    sourceCount,
    datasetCount: datasets.length,
    observationCount,
    latestImportAt: latestImport?.completedAt ?? latestImport?.startedAt ?? null,
    unmappedCount,
    revisionCount,
    failedRecordsCount: failedRecordsAgg._sum.recordsRejected ?? 0,
    healthCounts,
    datasets,
  };
}
