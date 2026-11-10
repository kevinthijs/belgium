import "server-only";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format/money";
import { toDisplayStatus } from "./status-labels";
import { DEBT_CONTRIBUTION_METHODOLOGY_NOTE, DEBT_CONTRIBUTION_CONSOLIDATION_WARNING } from "./government-sectors-copy";
import type { MetricResult, SourceReference } from "./types";

export { DEBT_CONTRIBUTION_METHODOLOGY_NOTE, DEBT_CONTRIBUTION_CONSOLIDATION_WARNING };

/**
 * Government-subsector overview (S1311/S1312/S1313/S1314), sourced from
 * NBB's DF_NFGOV_DISS import. This module deliberately never sums the
 * four subsectors to reconstruct S13 — see docs/CONSOLIDATION.md and the
 * `assertNoSubsectorSummation` guard used by its tests. If S13 is needed,
 * query the official S13 observation (entity slug "belgie") directly.
 */

export const GOVERNMENT_SUBSECTORS = [
  { slug: "federale-overheid", sectorCode: "S1311", label: "Federale overheid" },
  { slug: "gemeenschappen-en-gewesten", sectorCode: "S1312", label: "Gemeenschappen en gewesten" },
  { slug: "lokale-overheden", sectorCode: "S1313", label: "Lokale overheden" },
  { slug: "sociale-zekerheid", sectorCode: "S1314", label: "Sociale zekerheid" },
] as const;

export type GovernmentSectorSlug = (typeof GOVERNMENT_SUBSECTORS)[number]["slug"];

const SECTOR_METRIC_CODES = {
  revenue: "government_revenue",
  expenditure: "government_expenditure",
  balance: "net_lending_borrowing",
} as const;

export type GovernmentSectorMetric = keyof typeof SECTOR_METRIC_CODES;

export interface GovernmentSectorRow {
  slug: GovernmentSectorSlug;
  sectorCode: string;
  label: string;
  revenue: MetricResult;
  expenditure: MetricResult;
  balance: MetricResult;
}

export interface GovernmentSectorOverview {
  available: boolean;
  period: string | null;
  year: number | null;
  rows: GovernmentSectorRow[];
  source: SourceReference | null;
  /** Always surfaced alongside the data so callers cannot accidentally omit it. */
  consolidationWarning: string;
}

const CONSOLIDATION_WARNING =
  "Deze bedragen mogen niet zomaar worden opgeteld door interne geldstromen tussen overheden.";

type SectorObservation = Awaited<ReturnType<typeof fetchSectorObservations>>[number];

function toMetricResult(observation: SectorObservation | undefined): MetricResult {
  if (!observation) return { available: false, reason: "Nog niet geïmporteerd voor deze periode." };
  const value = new Decimal(observation.value.toString()).mul(observation.unit.scaleFactor.toString());
  return {
    available: true,
    value: formatCurrency(value),
    rawValue: value.toString(),
    unit: "EUR_MILLION",
    period: observation.period.label,
    status: toDisplayStatus(observation.status),
    source: {
      organisation: observation.source.organisation.name,
      dataset: observation.source.name,
      datasetUrl: observation.source.landingPageUrl ?? undefined,
      period: observation.period.label,
      publishedAt: observation.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(observation.status),
    },
  };
}

async function fetchSectorObservations(entityIds: string[]) {
  return prisma.observation.findMany({
    where: {
      entityId: { in: entityIds },
      metric: { code: { in: Object.values(SECTOR_METRIC_CODES) } },
      period: { periodType: "YEAR" },
      classificationItemId: null,
    },
    include: { unit: true, period: true, metric: true, entity: true, source: { include: { organisation: true } } },
    orderBy: { period: { year: "desc" } },
  });
}

/**
 * Overview for all four subsectors at the latest annual period all four
 * have revenue + expenditure + balance for (the "latest common compatible
 * NBB annual period"), or at an explicitly requested year.
 */
export async function getGovernmentSectorOverview(period?: number): Promise<GovernmentSectorOverview> {
  const entities = await prisma.governmentEntity.findMany({
    where: { slug: { in: GOVERNMENT_SUBSECTORS.map((s) => s.slug) } },
  });
  if (entities.length !== GOVERNMENT_SUBSECTORS.length) {
    return { available: false, period: null, year: null, rows: [], source: null, consolidationWarning: CONSOLIDATION_WARNING };
  }

  const observations = await fetchSectorObservations(entities.map((e) => e.id));
  if (observations.length === 0) {
    return { available: false, period: null, year: null, rows: [], source: null, consolidationWarning: CONSOLIDATION_WARNING };
  }

  // byYear[year][entitySlug][metricCode] = observation
  const byYear = new Map<number, Map<string, Map<string, (typeof observations)[number]>>>();
  for (const o of observations) {
    const entitySlug = o.entity.slug;
    const year = o.period.year;
    if (!byYear.has(year)) byYear.set(year, new Map());
    const forYear = byYear.get(year)!;
    if (!forYear.has(entitySlug)) forYear.set(entitySlug, new Map());
    forYear.get(entitySlug)!.set(o.metric.code, o);
  }

  const requiredMetrics = Object.values(SECTOR_METRIC_CODES);
  const isComplete = (year: number) => {
    const forYear = byYear.get(year);
    if (!forYear) return false;
    return GOVERNMENT_SUBSECTORS.every((s) => {
      const bySlug = forYear.get(s.slug);
      return bySlug && requiredMetrics.every((m) => bySlug.has(m));
    });
  };

  let targetYear: number | null = null;
  if (period !== undefined) {
    targetYear = isComplete(period) ? period : null;
  } else {
    const years = [...byYear.keys()].sort((a, b) => b - a);
    targetYear = years.find((y) => isComplete(y)) ?? null;
  }

  if (targetYear === null) {
    return { available: false, period: null, year: null, rows: [], source: null, consolidationWarning: CONSOLIDATION_WARNING };
  }

  const forYear = byYear.get(targetYear)!;
  const rows: GovernmentSectorRow[] = GOVERNMENT_SUBSECTORS.map((s) => {
    const bySlug = forYear.get(s.slug)!;
    return {
      slug: s.slug,
      sectorCode: s.sectorCode,
      label: s.label,
      revenue: toMetricResult(bySlug.get(SECTOR_METRIC_CODES.revenue)),
      expenditure: toMetricResult(bySlug.get(SECTOR_METRIC_CODES.expenditure)),
      balance: toMetricResult(bySlug.get(SECTOR_METRIC_CODES.balance)),
    };
  });

  const anyObservation = forYear.get(GOVERNMENT_SUBSECTORS[0].slug)!.get(SECTOR_METRIC_CODES.revenue)!;
  return {
    available: true,
    period: anyObservation.period.label,
    year: targetYear,
    rows,
    source: {
      organisation: anyObservation.source.organisation.name,
      dataset: anyObservation.source.name,
      datasetUrl: anyObservation.source.landingPageUrl ?? undefined,
      period: anyObservation.period.label,
      publishedAt: anyObservation.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(anyObservation.status),
    },
    consolidationWarning: CONSOLIDATION_WARNING,
  };
}

/**
 * "Bijdrage aan de geconsolideerde overheidsschuld" — NBB `DF_CGD`, metric
 * `subsectorDebtContribution`. This is each subsector's own consolidated
 * gross debt figure, presented by NBB's own `GSECTOR` codelist as that
 * subsector's contribution to the whole-government total (`S1300`,
 * entity "belgie", metric `government_debt`). Live data shows the four
 * subsector figures do NOT sum exactly to the S1300 total (see
 * docs/GOVERNMENT_SUBSECTORS.md) — same non-summation caveat as
 * revenue/expenditure/balance, so this module never presents these four
 * figures as parts of a 100% whole.
 */
const DEBT_CONTRIBUTION_METRIC_CODE = "subsectorDebtContribution";
const TOTAL_DEBT_METRIC_CODE = "government_debt";

export interface GovernmentSectorDebtContributionRow {
  slug: GovernmentSectorSlug;
  sectorCode: string;
  label: string;
  contribution: MetricResult;
}

export interface GovernmentSectorDebtContributionOverview {
  available: boolean;
  period: string | null;
  year: number | null;
  quarter: number | null;
  rows: GovernmentSectorDebtContributionRow[];
  /** Official S1300 total consolidated gross debt for the same quarter — never derived by summing `rows`. */
  totalConsolidatedGrossDebt: MetricResult | null;
  source: SourceReference | null;
  consolidationWarning: string;
  methodologyNote: string;
}

async function fetchDebtContributionObservations(entityIds: string[]) {
  return prisma.observation.findMany({
    where: {
      entityId: { in: entityIds },
      metric: { code: DEBT_CONTRIBUTION_METRIC_CODE },
      period: { periodType: "QUARTER" },
      classificationItemId: null,
    },
    include: { unit: true, period: true, metric: true, entity: true, source: { include: { organisation: true } } },
    orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
  });
}

/**
 * Debt-contribution overview for all four subsectors at the latest
 * quarter all four have a `subsectorDebtContribution` observation for, or
 * an explicitly requested quarter (period label "YYYY-Qn", e.g. "2026-Q1").
 */
export async function getGovernmentSectorDebtContributions(period?: string): Promise<GovernmentSectorDebtContributionOverview> {
  const empty: GovernmentSectorDebtContributionOverview = {
    available: false,
    period: null,
    year: null,
    quarter: null,
    rows: [],
    totalConsolidatedGrossDebt: null,
    source: null,
    consolidationWarning: DEBT_CONTRIBUTION_CONSOLIDATION_WARNING,
    methodologyNote: DEBT_CONTRIBUTION_METHODOLOGY_NOTE,
  };

  const entities = await prisma.governmentEntity.findMany({
    where: { slug: { in: GOVERNMENT_SUBSECTORS.map((s) => s.slug) } },
  });
  if (entities.length !== GOVERNMENT_SUBSECTORS.length) return empty;

  const observations = await fetchDebtContributionObservations(entities.map((e) => e.id));
  if (observations.length === 0) return empty;

  // byPeriod["YYYY-Qn"][entitySlug] = observation
  const byPeriod = new Map<string, Map<string, (typeof observations)[number]>>();
  for (const o of observations) {
    if (o.period.quarter == null) continue;
    const key = `${o.period.year}-Q${o.period.quarter}`;
    if (!byPeriod.has(key)) byPeriod.set(key, new Map());
    byPeriod.get(key)!.set(o.entity.slug, o);
  }

  const isComplete = (key: string) => {
    const forPeriod = byPeriod.get(key);
    return !!forPeriod && GOVERNMENT_SUBSECTORS.every((s) => forPeriod.has(s.slug));
  };

  let targetKey: string | null = null;
  if (period !== undefined) {
    targetKey = isComplete(period) ? period : null;
  } else {
    const keys = [...byPeriod.keys()].sort((a, b) => b.localeCompare(a));
    targetKey = keys.find((k) => isComplete(k)) ?? null;
  }
  if (targetKey === null) return empty;

  const forPeriod = byPeriod.get(targetKey)!;
  const rows: GovernmentSectorDebtContributionRow[] = GOVERNMENT_SUBSECTORS.map((s) => ({
    slug: s.slug,
    sectorCode: s.sectorCode,
    label: s.label,
    contribution: toMetricResult(forPeriod.get(s.slug)),
  }));

  const anyObservation = forPeriod.get(GOVERNMENT_SUBSECTORS[0].slug)!;
  const [yearStr, quarterStr] = targetKey.split("-Q");

  const totalObservation = await prisma.observation.findFirst({
    where: {
      entity: { slug: "belgie" },
      metric: { code: TOTAL_DEBT_METRIC_CODE },
      source: { code: "DF_CGD" },
      period: { periodType: "QUARTER", year: Number(yearStr), quarter: Number(quarterStr) },
      classificationItemId: null,
    },
    include: { unit: true, period: true, metric: true, entity: true, source: { include: { organisation: true } } },
  });

  return {
    available: true,
    period: anyObservation.period.label,
    year: Number(yearStr),
    quarter: Number(quarterStr),
    rows,
    totalConsolidatedGrossDebt: totalObservation ? toMetricResult(totalObservation) : null,
    source: {
      organisation: anyObservation.source.organisation.name,
      dataset: anyObservation.source.name,
      datasetUrl: anyObservation.source.landingPageUrl ?? undefined,
      period: anyObservation.period.label,
      publishedAt: anyObservation.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(anyObservation.status),
    },
    consolidationWarning: DEBT_CONTRIBUTION_CONSOLIDATION_WARNING,
    methodologyNote: DEBT_CONTRIBUTION_METHODOLOGY_NOTE,
  };
}

export interface GovernmentSectorDebtContributionHistoryPoint {
  year: number;
  quarter: number;
  period: string;
  valueEUR: string;
  status: string;
}

export interface GovernmentSectorDebtContributionHistory {
  available: boolean;
  sectorCode: string | null;
  points: GovernmentSectorDebtContributionHistoryPoint[];
  source: SourceReference | null;
}

/** Full quarterly `subsectorDebtContribution` history for one subsector. */
export async function getGovernmentSectorDebtContributionHistory(
  sectorSlug: GovernmentSectorSlug,
): Promise<GovernmentSectorDebtContributionHistory> {
  const sectorDef = GOVERNMENT_SUBSECTORS.find((s) => s.slug === sectorSlug);
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: sectorSlug } });
  if (!entity || !sectorDef) {
    return { available: false, sectorCode: null, points: [], source: null };
  }

  const observations = await prisma.observation.findMany({
    where: {
      entityId: entity.id,
      metric: { code: DEBT_CONTRIBUTION_METRIC_CODE },
      period: { periodType: "QUARTER" },
      classificationItemId: null,
    },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: [{ period: { year: "asc" } }, { period: { quarter: "asc" } }],
  });
  if (observations.length === 0) {
    return { available: false, sectorCode: sectorDef.sectorCode, points: [], source: null };
  }

  const points = observations
    .filter((o) => o.period.quarter != null)
    .map((o) => ({
      year: o.period.year,
      quarter: o.period.quarter!,
      period: o.period.label,
      valueEUR: new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()).toString(),
      status: toDisplayStatus(o.status),
    }));

  const last = observations[observations.length - 1]!;
  return {
    available: true,
    sectorCode: sectorDef.sectorCode,
    points,
    source: {
      organisation: last.source.organisation.name,
      dataset: last.source.name,
      datasetUrl: last.source.landingPageUrl ?? undefined,
      period: `${points[0]!.period} – ${last.period.label}`,
      publishedAt: last.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(last.status),
    },
  };
}

export interface GovernmentSectorHistoryPoint {
  year: number;
  period: string;
  valueEUR: string;
  status: string;
}

export interface GovernmentSectorHistory {
  available: boolean;
  sectorCode: string | null;
  metric: GovernmentSectorMetric;
  points: GovernmentSectorHistoryPoint[];
  source: SourceReference | null;
}

/** Full annual history for one subsector + one metric (revenue/expenditure/balance). */
export async function getGovernmentSectorHistory(
  sectorSlug: GovernmentSectorSlug,
  metric: GovernmentSectorMetric,
): Promise<GovernmentSectorHistory> {
  const sectorDef = GOVERNMENT_SUBSECTORS.find((s) => s.slug === sectorSlug);
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: sectorSlug } });
  if (!entity || !sectorDef) {
    return { available: false, sectorCode: null, metric, points: [], source: null };
  }

  const observations = await prisma.observation.findMany({
    where: {
      entityId: entity.id,
      metric: { code: SECTOR_METRIC_CODES[metric] },
      period: { periodType: "YEAR" },
      classificationItemId: null,
    },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: { period: { year: "asc" } },
  });
  if (observations.length === 0) {
    return { available: false, sectorCode: sectorDef.sectorCode, metric, points: [], source: null };
  }

  const points = observations.map((o) => ({
    year: o.period.year,
    period: o.period.label,
    valueEUR: new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()).toString(),
    status: toDisplayStatus(o.status),
  }));

  const last = observations[observations.length - 1]!;
  return {
    available: true,
    sectorCode: sectorDef.sectorCode,
    metric,
    points,
    source: {
      organisation: last.source.organisation.name,
      dataset: last.source.name,
      datasetUrl: last.source.landingPageUrl ?? undefined,
      period: `${points[0]!.period} – ${last.period.label}`,
      publishedAt: last.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(last.status),
    },
  };
}
