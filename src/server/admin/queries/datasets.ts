import "server-only";
import { prisma } from "@/lib/prisma";
import { getDatasetHealth } from "../dataset-health";
import { getPublicUsageForDataset } from "../source-dependencies";
import { selectLastAttempt, selectLastSuccessfulRun } from "../import-run-helpers";

export async function getDatasetDetail(id: string) {
  const dataset = await prisma.sourceDataset.findUnique({
    where: { id },
    include: {
      organisation: true,
      accountingFramework: true,
      importRuns: { orderBy: { startedAt: "desc" }, take: 25 },
    },
  });
  if (!dataset) return null;

  const lastAttempt = selectLastAttempt(dataset.importRuns);
  const lastSuccess = selectLastSuccessfulRun(dataset.importRuns);

  const [
    observationCount,
    entityCount,
    metricCount,
    periodCount,
    classificationCount,
    revisionCount,
    unmappedCount,
    unexpectedUnmappedCount,
    rejectedSum,
  ] = await Promise.all([
    prisma.observation.count({ where: { sourceId: id } }),
    prisma.observation.findMany({ where: { sourceId: id }, distinct: ["entityId"], select: { entityId: true } }).then((r) => r.length),
    prisma.observation.findMany({ where: { sourceId: id }, distinct: ["metricId"], select: { metricId: true } }).then((r) => r.length),
    prisma.observation.findMany({ where: { sourceId: id }, distinct: ["periodId"], select: { periodId: true } }).then((r) => r.length),
    prisma.observation
      .findMany({ where: { sourceId: id, classificationItemId: { not: null } }, distinct: ["classificationItemId"], select: { classificationItemId: true } })
      .then((r) => r.length),
    prisma.observationRevision.count({ where: { importRun: { datasetId: id } } }),
    prisma.unmappedSourceValue.count({ where: { importRun: { datasetId: id }, resolvedAt: null } }),
    prisma.unmappedSourceValue.count({ where: { importRun: { datasetId: id }, resolvedAt: null, severity: { not: "INFO" } } }),
    prisma.importRun.aggregate({ where: { datasetId: id }, _sum: { recordsRejected: true } }),
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
  });

  return {
    dataset,
    health,
    lastAttempt,
    lastSuccess,
    stats: {
      observationCount,
      entityCount,
      metricCount,
      periodCount,
      classificationCount,
      revisionCount,
      unmappedCount,
      unexpectedUnmappedCount,
      rejectedCount: rejectedSum._sum.recordsRejected ?? 0,
    },
    importHistory: dataset.importRuns,
    publicUsage: getPublicUsageForDataset(dataset.code),
  };
}
