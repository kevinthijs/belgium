import "server-only";
import { prisma } from "@/lib/prisma";
import type { ImportRunStatus } from "@/generated/prisma";
import { resolvePageInput, toPageResult, type PageInput, type PageResult } from "../pagination";

export interface ImportRunFilters extends PageInput {
  datasetId?: string;
  status?: ImportRunStatus;
}

export interface ImportRunListItem {
  id: string;
  datasetCode: string;
  datasetName: string;
  organisationName: string;
  startedAt: Date;
  completedAt: Date | null;
  status: ImportRunStatus;
  recordsReceived: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsUnchanged: number;
  recordsRejected: number;
  recordsFiltered: number;
  revisionCount: number;
  durationMs: number | null;
}

export async function getImportRuns(filters: ImportRunFilters = {}): Promise<PageResult<ImportRunListItem>> {
  const { page, pageSize, skip, take } = resolvePageInput(filters);

  const where = {
    ...(filters.datasetId ? { datasetId: filters.datasetId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [runs, total] = await Promise.all([
    prisma.importRun.findMany({
      where,
      include: { dataset: { include: { organisation: true } }, _count: { select: { revisions: true } } },
      orderBy: { startedAt: "desc" },
      skip,
      take,
    }),
    prisma.importRun.count({ where }),
  ]);

  const items: ImportRunListItem[] = runs.map((run) => ({
    id: run.id,
    datasetCode: run.dataset.code,
    datasetName: run.dataset.name,
    organisationName: run.dataset.organisation.name,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    status: run.status,
    recordsReceived: run.recordsReceived,
    recordsCreated: run.recordsCreated,
    recordsUpdated: run.recordsUpdated,
    recordsUnchanged: run.recordsUnchanged,
    recordsRejected: run.recordsRejected,
    recordsFiltered: run.recordsFiltered,
    revisionCount: run._count.revisions,
    durationMs: run.completedAt ? run.completedAt.getTime() - run.startedAt.getTime() : null,
  }));

  return toPageResult(items, total, page, pageSize);
}

export async function getImportRunDetail(id: string) {
  const run = await prisma.importRun.findUnique({
    where: { id },
    include: {
      dataset: { include: { organisation: true } },
      unmappedValues: { take: 50, orderBy: { detectedAt: "desc" } },
      revisions: { take: 50, orderBy: { detectedAt: "desc" } },
      _count: { select: { unmappedValues: true, revisions: true, rawSnapshots: true } },
    },
  });
  return run;
}

export async function isImportRunning(datasetId: string): Promise<boolean> {
  const running = await prisma.importRun.findFirst({ where: { datasetId, status: "RUNNING" } });
  return running !== null;
}
