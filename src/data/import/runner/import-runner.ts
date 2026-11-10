import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import type { DataSourceAdapter, NormalizedObservation } from "@/data/core/types";
import { resolveEntityId } from "@/data/mappings/entities/resolve-entity";
import { resolveMetricId } from "@/data/mappings/metrics/resolve-metric";
import { resolveUnitId } from "@/data/mappings/units/resolve-unit";
import { resolveClassificationItemId } from "@/data/mappings/classifications/resolve-classification";
import { resolvePeriodId } from "./resolve-period";
import { detectRevision } from "@/data/import/revision-detector/detect-revision";
import { classifyUnmapped, type UnmappedCategory } from "@/server/admin/unmapped-classification";

/** Categories the importer expected and intentionally doesn't support —
 * these count toward `recordsFiltered`, never `recordsRejected`, so routine
 * exclusions (other-EU-country geo codes, Statbel aggregate rows, known
 * defunct municipalities) never make a healthy dataset look broken. */
const FILTERED_CATEGORIES: ReadonlySet<UnmappedCategory> = new Set(["EXPECTED_UNSUPPORTED", "HISTORICAL_ENTITY"]);

export interface RunImportOptions {
  /** ExternalEntityIdentifier scheme used to resolve `sourceEntityCode`, e.g. "EUROSTAT_GEO". */
  entityIdentifierScheme: string;
  sourceDatasetId: string;
  accountingFrameworkCode?: string;
}

export interface ImportRunSummary {
  importRunId: string;
  received: number;
  created: number;
  updated: number;
  unchanged: number;
  rejected: number;
  filtered: number;
}

/**
 * Runs one adapter end-to-end: fetch -> validate -> normalize -> map onto
 * canonical registry rows -> upsert observations with revision tracking.
 * Unmapped entity/metric/unit codes are recorded, never dropped silently.
 */
export async function runImport(
  adapter: DataSourceAdapter,
  options: RunImportOptions,
): Promise<ImportRunSummary> {
  const importRun = await prisma.importRun.create({
    data: { datasetId: options.sourceDatasetId, status: "RUNNING" },
  });

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let rejected = 0;
  let filtered = 0;
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const raw = await adapter.fetch();
    await prisma.sourceDataset.update({
      where: { id: options.sourceDatasetId },
      data: { lastCheckedAt: new Date() },
    });
    const validation = await adapter.validate(raw);
    if (!validation.valid) {
      for (const issue of validation.issues) errors.push(`${issue.path}: ${issue.message}`);
      throw new Error("Dataset failed validation");
    }

    const normalized = await adapter.normalize(raw);
    const accountingFrameworkId = options.accountingFrameworkCode
      ? (
          await prisma.accountingFramework.findUnique({
            where: { code: options.accountingFrameworkCode as never },
            select: { id: true },
          })
        )?.id
      : undefined;

    for (const obs of normalized) {
      const result = await applyObservation(obs, {
        importRunId: importRun.id,
        sourceDatasetId: options.sourceDatasetId,
        datasetCode: adapter.datasetCode,
        entityIdentifierScheme: options.entityIdentifierScheme,
        accountingFrameworkId,
      });
      if (result.outcome === "created") created++;
      else if (result.outcome === "updated") updated++;
      else if (result.outcome === "unchanged") unchanged++;
      else if (result.category && FILTERED_CATEGORIES.has(result.category)) {
        filtered++;
      } else {
        rejected++;
        warnings.push(`Rejected observation: entity=${obs.sourceEntityCode} metric=${obs.sourceMetricCode} period=${obs.periodLabel} (${result.outcome})`);
      }
    }

    await prisma.importRun.update({
      where: { id: importRun.id },
      data: {
        completedAt: new Date(),
        status: rejected > 0 ? "PARTIAL_SUCCESS" : "SUCCESS",
        sourceChecksum: raw.checksum,
        recordsReceived: normalized.length,
        recordsCreated: created,
        recordsUpdated: updated,
        recordsUnchanged: unchanged,
        recordsRejected: rejected,
        recordsFiltered: filtered,
        warnings: warnings.length ? warnings : undefined,
      },
    });

    if (created > 0 || updated > 0) {
      await prisma.sourceDataset.update({
        where: { id: options.sourceDatasetId },
        data: { lastChangedAt: new Date() },
      });
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    await prisma.importRun.update({
      where: { id: importRun.id },
      data: { completedAt: new Date(), status: "FAILED", errors },
    });
    throw error;
  }

  return {
    importRunId: importRun.id,
    received: created + updated + unchanged + rejected + filtered,
    created,
    updated,
    unchanged,
    rejected,
    filtered,
  };
}

type ApplyOutcome =
  | "created"
  | "updated"
  | "unchanged"
  | "unmapped_entity"
  | "unmapped_metric"
  | "unmapped_unit"
  | "unmapped_classification";

interface ApplyResult {
  outcome: ApplyOutcome;
  category?: UnmappedCategory;
}

async function applyObservation(
  obs: NormalizedObservation,
  ctx: {
    importRunId: string;
    sourceDatasetId: string;
    datasetCode: string;
    entityIdentifierScheme: string;
    accountingFrameworkId?: string;
  },
): Promise<ApplyResult> {
  const entityId = await resolveEntityId(ctx.entityIdentifierScheme, obs.sourceEntityCode);
  if (!entityId) {
    const category = await recordUnmapped(ctx.importRunId, ctx.datasetCode, "entity", obs.sourceEntityCode, obs);
    return { outcome: "unmapped_entity", category };
  }

  const metricId = await resolveMetricId(obs.sourceMetricCode);
  if (!metricId) {
    const category = await recordUnmapped(ctx.importRunId, ctx.datasetCode, "metric", obs.sourceMetricCode, obs);
    return { outcome: "unmapped_metric", category };
  }

  const unitId = await resolveUnitId(obs.sourceUnitCode);
  if (!unitId) {
    const category = await recordUnmapped(ctx.importRunId, ctx.datasetCode, "unit", obs.sourceUnitCode, obs);
    return { outcome: "unmapped_unit", category };
  }

  let classificationItemId: string | null = null;
  if (obs.sourceClassificationSystem && obs.sourceClassificationCode) {
    classificationItemId = await resolveClassificationItemId(
      obs.sourceClassificationSystem,
      obs.sourceClassificationCode,
    );
    if (!classificationItemId) {
      const category = await recordUnmapped(ctx.importRunId, ctx.datasetCode, "classification", obs.sourceClassificationCode, obs);
      return { outcome: "unmapped_classification", category };
    }
  }

  const periodId = await resolvePeriodId(obs);

  const existing = await prisma.observation.findFirst({
    where: {
      entityId,
      metricId,
      periodId,
      classificationItemId,
      accountingFrameworkId: ctx.accountingFrameworkId ?? null,
      sourceId: ctx.sourceDatasetId,
    },
  });

  const revision = detectRevision(existing ? new Decimal(existing.value.toString()) : null, obs.value);

  if (revision.kind === "UNCHANGED") return { outcome: "unchanged" };

  if (revision.kind === "NEW") {
    await prisma.observation.create({
      data: {
        entityId,
        metricId,
        periodId,
        classificationItemId,
        accountingFrameworkId: ctx.accountingFrameworkId,
        value: obs.value.toString(),
        unitId,
        status: obs.status,
        qualityStatus: statusToQuality(obs.status),
        consolidationStatus: "UNKNOWN",
        sourceId: ctx.sourceDatasetId,
        sourceDimensions: obs.sourceDimensions,
        publishedAt: obs.publishedAt,
      },
    });
    return { outcome: "created" };
  }

  // REVISED: write history row, then update in place.
  await prisma.$transaction([
    prisma.observationRevision.create({
      data: {
        observationId: existing!.id,
        previousValue: revision.previousValue.toString(),
        newValue: revision.newValue.toString(),
        importRunId: ctx.importRunId,
      },
    }),
    prisma.observation.update({
      where: { id: existing!.id },
      data: {
        value: obs.value.toString(),
        status: obs.status,
        qualityStatus: statusToQuality(obs.status),
        revisedAt: new Date(),
      },
    }),
  ]);
  return { outcome: "updated" };
}

async function recordUnmapped(
  importRunId: string,
  datasetCode: string,
  dimension: string,
  rawValue: string,
  obs: NormalizedObservation,
): Promise<UnmappedCategory> {
  const { category, severity } = classifyUnmapped({
    datasetCode,
    dimension,
    rawValue,
    sourceDimensions: obs.sourceDimensions,
  });
  await prisma.unmappedSourceValue.create({
    data: {
      importRunId,
      dimension,
      rawValue,
      context: { period: obs.periodLabel, metric: obs.sourceMetricCode, entity: obs.sourceEntityCode },
      category,
      severity,
    },
  });
  return category;
}

function statusToQuality(status: NormalizedObservation["status"]) {
  switch (status) {
    case "FINAL":
      return "OFFICIAL_FINAL" as const;
    case "PROVISIONAL":
      return "OFFICIAL_PROVISIONAL" as const;
    case "BUDGET":
    case "ADJUSTED_BUDGET":
      return "OFFICIAL_BUDGET" as const;
    case "FORECAST":
      return "OFFICIAL_FORECAST" as const;
    case "ESTIMATE":
      return "ESTIMATED" as const;
    default:
      return "UNKNOWN" as const;
  }
}
