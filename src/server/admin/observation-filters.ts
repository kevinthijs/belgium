import type { ObservationStatus, QualityStatus } from "@/generated/prisma";

export interface ObservationWhereFilters {
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

/** Builds the Prisma `where` clause for the observation inspector — every
 * filter is optional and only applied when actually supplied, so an empty
 * `filters` object matches every observation (used, with pagination, rather
 * than ever loading the full table into the app). */
export function buildObservationWhere(filters: ObservationWhereFilters) {
  return {
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.metricId ? { metricId: filters.metricId } : {}),
    ...(filters.periodId ? { periodId: filters.periodId } : {}),
    ...(filters.datasetId ? { sourceId: filters.datasetId } : {}),
    ...(filters.sectorId ? { entity: { statisticalSectorId: filters.sectorId } } : {}),
    ...(filters.frameworkId ? { accountingFrameworkId: filters.frameworkId } : {}),
    ...(filters.classificationItemId ? { classificationItemId: filters.classificationItemId } : {}),
    ...(filters.unitId ? { unitId: filters.unitId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.quality ? { qualityStatus: filters.quality } : {}),
    ...(filters.isDemoData !== undefined ? { isDemoData: filters.isDemoData } : {}),
  };
}
