import "server-only";
import { prisma } from "@/lib/prisma";
import { sortUnmappedByOccurrence, type UnmappedGroup } from "../unmapped-grouping";

export type { UnmappedGroup } from "../unmapped-grouping";

export interface UnmappedFilters {
  datasetId?: string;
  dimension?: string;
  category?: string;
  severity?: string;
  status?: string;
  includeResolved?: boolean;
}

/**
 * Groups UnmappedSourceValue rows by (dataset, dimension, rawValue) via
 * DB-level aggregation (never loads the full — potentially tens of
 * thousands of rows — table into the app) so repeated occurrences across
 * many import runs show up as one row with an occurrence count, per the
 * /admin/data/unmapped spec. Never discards a row — grouping is purely a
 * display aggregation. Category/severity are deterministic per
 * (dataset, dimension, rawValue), so including them in the groupBy `by`
 * never splits a logical group into more than one row.
 */
export async function getUnmappedGrouped(filters: UnmappedFilters = {}): Promise<UnmappedGroup[]> {
  const datasets = await prisma.sourceDataset.findMany({
    where: filters.datasetId ? { id: filters.datasetId } : undefined,
    select: { id: true, code: true },
  });

  const groupsPerDataset = await Promise.all(
    datasets.map(async (dataset) => {
      const grouped = await prisma.unmappedSourceValue.groupBy({
        by: ["dimension", "rawValue", "category", "severity"],
        where: {
          importRun: { datasetId: dataset.id },
          ...(filters.dimension ? { dimension: filters.dimension } : {}),
          ...(filters.category ? { category: filters.category as never } : {}),
          ...(filters.severity ? { severity: filters.severity as never } : {}),
          ...(filters.status ? { status: filters.status as never } : {}),
          ...(filters.includeResolved ? {} : { resolvedAt: null }),
        },
        _count: { _all: true },
        _min: { detectedAt: true },
        _max: { detectedAt: true },
      });

      return Promise.all(
        grouped.map(async (g) => {
          const [sample, resolvedCount] = await Promise.all([
            prisma.unmappedSourceValue.findFirst({
              where: { importRun: { datasetId: dataset.id }, dimension: g.dimension, rawValue: g.rawValue },
              select: { context: true, status: true },
              orderBy: { detectedAt: "desc" },
            }),
            prisma.unmappedSourceValue.count({
              where: { importRun: { datasetId: dataset.id }, dimension: g.dimension, rawValue: g.rawValue, resolvedAt: { not: null } },
            }),
          ]);

          const group: UnmappedGroup = {
            datasetCode: dataset.code,
            dimension: g.dimension,
            rawValue: g.rawValue,
            category: g.category,
            severity: g.severity,
            latestStatus: sample?.status ?? "OPEN",
            occurrenceCount: g._count._all,
            firstDetectedAt: g._min.detectedAt!,
            lastDetectedAt: g._max.detectedAt!,
            sampleContext: sample?.context ?? null,
            resolvedCount,
          };
          return group;
        }),
      );
    }),
  );

  return sortUnmappedByOccurrence(groupsPerDataset.flat());
}

export interface UnmappedSummary {
  totalOccurrences: number;
  byCategory: { category: string; occurrenceCount: number }[];
}

/** Breakdown used for the page's summary line ("X voorkomens — Y onverwacht
 * — Z verwacht uitgesloten — ..."), computed with the same filters as the
 * table (minus category, so every category's total is visible regardless of
 * which one is currently selected). */
export async function getUnmappedSummary(filters: Omit<UnmappedFilters, "category"> = {}): Promise<UnmappedSummary> {
  const grouped = await prisma.unmappedSourceValue.groupBy({
    by: ["category"],
    where: {
      ...(filters.datasetId ? { importRun: { datasetId: filters.datasetId } } : {}),
      ...(filters.dimension ? { dimension: filters.dimension } : {}),
      ...(filters.severity ? { severity: filters.severity as never } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.includeResolved ? {} : { resolvedAt: null }),
    },
    _count: { _all: true },
  });

  const byCategory = grouped
    .map((g) => ({ category: g.category, occurrenceCount: g._count._all }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount);

  return {
    totalOccurrences: byCategory.reduce((sum, g) => sum + g.occurrenceCount, 0),
    byCategory,
  };
}

/** All (dataset, dimension, rawValue) IDs for a group — fetched lazily only
 * when the operator actually marks a group as reviewed, never on page load. */
export async function getUnmappedGroupIds(datasetCode: string, dimension: string, rawValue: string): Promise<string[]> {
  const rows = await prisma.unmappedSourceValue.findMany({
    where: { importRun: { dataset: { code: datasetCode } }, dimension, rawValue, resolvedAt: null },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function markUnmappedGroupStatus(ids: string[], status: "REVIEWED" | "IGNORED_EXPECTED"): Promise<number> {
  const result = await prisma.unmappedSourceValue.updateMany({
    where: { id: { in: ids }, resolvedAt: null },
    data: { status, resolvedAt: new Date() },
  });
  return result.count;
}
