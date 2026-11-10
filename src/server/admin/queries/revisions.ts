import "server-only";
import { prisma } from "@/lib/prisma";
import { resolvePageInput, toPageResult, type PageInput, type PageResult } from "../pagination";
import { computeRevisionDiff } from "../revision-diff";

export interface RevisionFilters extends PageInput {
  datasetId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface RevisionListItem {
  id: string;
  detectedAt: Date;
  datasetCode: string;
  entityName: string;
  metricCode: string;
  periodLabel: string;
  previousValue: string | null;
  newValue: string;
  absoluteDifference: string | null;
  percentageDifference: string | null;
  importRunId: string | null;
}

export async function getRevisions(filters: RevisionFilters = {}): Promise<PageResult<RevisionListItem>> {
  const { page, pageSize, skip, take } = resolvePageInput(filters);

  const where = {
    ...(filters.datasetId ? { observation: { sourceId: filters.datasetId } } : {}),
    ...(filters.fromDate || filters.toDate
      ? { detectedAt: { ...(filters.fromDate ? { gte: filters.fromDate } : {}), ...(filters.toDate ? { lte: filters.toDate } : {}) } }
      : {}),
  };

  const [revisions, total] = await Promise.all([
    prisma.observationRevision.findMany({
      where,
      include: { observation: { include: { entity: true, metric: true, period: true, source: true } } },
      orderBy: { detectedAt: "desc" },
      skip,
      take,
    }),
    prisma.observationRevision.count({ where }),
  ]);

  const items: RevisionListItem[] = revisions.map((r) => {
    const { absoluteDifference, percentageDifference } = computeRevisionDiff(r.previousValue, r.newValue);

    return {
      id: r.id,
      detectedAt: r.detectedAt,
      datasetCode: r.observation.source.code,
      entityName: r.observation.entity.name,
      metricCode: r.observation.metric.code,
      periodLabel: r.observation.period.label,
      previousValue: r.previousValue?.toString() ?? null,
      newValue: r.newValue.toString(),
      absoluteDifference: absoluteDifference?.toString() ?? null,
      percentageDifference: percentageDifference ? `${percentageDifference.toDecimalPlaces(2).toString()}%` : null,
      importRunId: r.importRunId,
    };
  });

  return toPageResult(items, total, page, pageSize);
}
