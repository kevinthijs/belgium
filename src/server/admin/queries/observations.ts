import "server-only";
import { prisma } from "@/lib/prisma";
import type { ObservationStatus, QualityStatus } from "@/generated/prisma";
import { resolvePageInput, toPageResult, type PageInput, type PageResult } from "../pagination";
import { buildObservationWhere } from "../observation-filters";

export interface ObservationFilters extends PageInput {
  entityId?: string;
  metricId?: string;
  periodId?: string;
  datasetId?: string;
  sectorId?: string;
  frameworkId?: string;
  classificationItemId?: string;
  unitId?: string;
  status?: ObservationStatus;
  quality?: QualityStatus;
  isDemoData?: boolean;
}

export interface ObservationListItem {
  id: string;
  entityName: string;
  metricCode: string;
  metricName: string;
  periodLabel: string;
  value: string;
  unitCode: string;
  sectorName: string | null;
  classificationLabel: string | null;
  status: ObservationStatus;
  qualityStatus: QualityStatus;
  datasetCode: string;
  updatedAt: Date;
}

export async function getObservations(filters: ObservationFilters = {}): Promise<PageResult<ObservationListItem>> {
  const { page, pageSize, skip, take } = resolvePageInput(filters);

  const where = buildObservationWhere(filters);

  const [observations, total] = await Promise.all([
    prisma.observation.findMany({
      where,
      include: {
        entity: { include: { statisticalSector: true } },
        metric: true,
        period: true,
        unit: true,
        classificationItem: true,
        source: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take,
    }),
    prisma.observation.count({ where }),
  ]);

  const items: ObservationListItem[] = observations.map((o) => ({
    id: o.id,
    entityName: o.entity.name,
    metricCode: o.metric.code,
    metricName: o.metric.name,
    periodLabel: o.period.label,
    value: o.value.toString(),
    unitCode: o.unit.code,
    sectorName: o.entity.statisticalSector?.name ?? null,
    classificationLabel: o.classificationItem ? `${o.classificationItem.code} — ${o.classificationItem.name}` : null,
    status: o.status,
    qualityStatus: o.qualityStatus,
    datasetCode: o.source.code,
    updatedAt: o.updatedAt,
  }));

  return toPageResult(items, total, page, pageSize);
}

export async function getObservationDetail(id: string) {
  const observation = await prisma.observation.findUnique({
    where: { id },
    include: {
      entity: true,
      metric: true,
      period: true,
      unit: true,
      classificationItem: { include: { system: true } },
      accountingFramework: true,
      source: { include: { organisation: true } },
      revisions: { orderBy: { detectedAt: "desc" }, include: { importRun: true } },
    },
  });
  if (!observation) return null;

  const derivationInputs = await prisma.derivationInput.findMany({
    where: { metricId: observation.metricId },
    include: { derivationDefinition: true },
  });

  return { observation, derivationDefinitionsUsingThisMetric: derivationInputs.map((d) => d.derivationDefinition) };
}
