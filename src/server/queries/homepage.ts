import "server-only";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { getDebtPerCapita } from "@/data/derivations/debt-per-capita";
import { getLatestCommonAnnualPeriod } from "@/data/derivations/latest-common-period";
import { formatPerCapita, formatCurrency, formatPercentage } from "@/lib/format/money";
import { toDisplayStatus } from "./status-labels";
import type { MetricResult, SourceReference } from "./types";

// ============================================================
// Debt hero (counter + supporting cards)
// ============================================================

export interface DebtHeroData {
  available: true;
  referenceValue: string; // raw EUR, string to preserve precision across the server/client boundary
  referenceTimestamp: string; // ISO date of the reference observation's period end
  estimatedAnnualChange: string; // raw EUR/year
  observationPeriod: string;
  methodologyDescription: string;
  source: SourceReference;
  qualityStatus: string;
  debtPerCapita: MetricResult;
  debtToGdp: MetricResult;
}

export type DebtHeroResult = DebtHeroData | { available: false; reason: string };

export async function getDebtHeroData(entitySlug = "belgie"): Promise<DebtHeroResult> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, reason: "Onbekende overheid." };

  const estimate = await prisma.debtEstimateModel.findFirst({
    where: { entityId: entity.id, validUntil: null },
    orderBy: { createdAt: "desc" },
    include: {
      referenceObservation: {
        include: { unit: true, period: true, source: { include: { organisation: true } } },
      },
    },
  });

  if (!estimate || !estimate.annualizedChange) {
    return { available: false, reason: "Nog geen schuldraming beschikbaar voor deze overheid." };
  }

  const obs = estimate.referenceObservation;
  const referenceValue = new Decimal(obs.value.toString()).mul(obs.unit.scaleFactor.toString());

  const source: SourceReference = {
    organisation: obs.source.organisation.name,
    dataset: obs.source.name,
    datasetUrl: obs.source.landingPageUrl ?? undefined,
    period: obs.period.label,
    publishedAt: obs.publishedAt?.toISOString() ?? null,
    status: toDisplayStatus(obs.status),
  };

  return {
    available: true,
    referenceValue: referenceValue.toString(),
    referenceTimestamp: obs.period.endDate.toISOString(),
    estimatedAnnualChange: new Decimal(estimate.annualizedChange.toString()).toString(),
    observationPeriod: obs.period.label,
    methodologyDescription: estimate.methodologyDescription,
    source,
    qualityStatus: estimate.qualityStatus,
    debtPerCapita: await getDebtPerCapitaMetric(entitySlug),
    debtToGdp: await getOfficialDebtToGdpMetric(entitySlug),
  };
}

/**
 * Official debt/GDP ratio — imported directly from Eurostat gov_10q_ggdebt
 * with unit=PC_GDP, never computed by dividing our own EUR debt figure by
 * a separately-sourced GDP series. Always based on the *official* quarterly
 * debt observation, never the animated estimated-current-debt counter.
 */
/**
 * Latest *official* government-debt observation as a plain MetricResult
 * (EUR, quarterly) — distinct from the animated estimated-current-debt
 * counter (`getDebtHeroData`'s `referenceValue`), which layers an estimate
 * on top of this same reference observation. Used wherever a page needs
 * "the official figure" without the estimate framing.
 */
export async function getOfficialDebtMetric(entitySlug: string): Promise<MetricResult> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, reason: "Onbekende overheid." };

  const observation = await prisma.observation.findFirst({
    where: { entityId: entity.id, metric: { code: "government_debt" } },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
  });
  if (!observation) return { available: false, reason: "Schuldcijfers nog niet geïmporteerd." };

  const value = new Decimal(observation.value.toString()).mul(observation.unit.scaleFactor.toString());
  return {
    available: true,
    value: formatCurrency(value),
    rawValue: value.toString(),
    unit: observation.unit.code,
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

export async function getOfficialDebtToGdpMetric(entitySlug: string): Promise<MetricResult> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, reason: "Onbekende overheid." };

  const observation = await prisma.observation.findFirst({
    where: { entityId: entity.id, metric: { code: "government_debt_pct_gdp" } },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
  });
  if (!observation) return { available: false, reason: "Schuld/bbp-cijfers nog niet geïmporteerd." };

  const value = new Decimal(observation.value.toString()).mul(observation.unit.scaleFactor.toString());
  return {
    available: true,
    value: formatPercentage(value),
    rawValue: value.toString(),
    unit: "PERCENT_GDP",
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

/**
 * Generic reader for Eurostat's own official "X / GDP" ratio series
 * (government_revenue_pct_gdp, government_expenditure_pct_gdp,
 * net_lending_borrowing_pct_gdp, government_debt_pct_gdp) — always the
 * source's own pre-computed ratio, never our EUR figure divided by a
 * separately-sourced GDP value (this app does not import a GDP-in-EUR
 * series at all, so that division is never available and must never be
 * silently faked).
 */
export async function getPctGdpMetric(entitySlug: string, metricCode: string): Promise<MetricResult> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, reason: "Onbekende overheid." };

  const observation = await prisma.observation.findFirst({
    where: { entityId: entity.id, metric: { code: metricCode }, classificationItemId: null },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
  });
  if (!observation) return { available: false, reason: "Deze verhouding is nog niet geïmporteerd." };

  const value = new Decimal(observation.value.toString()).mul(observation.unit.scaleFactor.toString());
  return {
    available: true,
    value: formatPercentage(value),
    rawValue: value.toString(),
    unit: "PERCENT_GDP",
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

export async function getDebtPerCapitaMetric(entitySlug: string): Promise<MetricResult> {
  const result = await getDebtPerCapita(entitySlug);
  if (!result) {
    return { available: false, reason: "Bevolkingscijfers nog niet geïmporteerd." };
  }
  return {
    available: true,
    value: formatPerCapita(result.valuePerCapita),
    rawValue: result.valuePerCapita.toString(),
    unit: "EUR_PER_CAPITA",
    period: result.populationPeriodLabel,
    status: toDisplayStatus(result.populationStatus),
    source: {
      organisation: result.populationSourceOrganisation,
      dataset: result.populationSourceDataset,
      datasetUrl: result.populationSourceDatasetUrl ?? undefined,
      period: result.populationPeriodLabel,
      publishedAt: result.populationPublishedAt?.toISOString() ?? null,
      status: toDisplayStatus(result.populationStatus),
    },
  };
}

// ============================================================
// Belgium overview (revenue / expenditure / balance)
// ============================================================

export interface BelgiumOverviewData {
  year: number | null;
  revenue: MetricResult;
  expenditure: MetricResult;
  balance: MetricResult;
  balanceIsDeficit: boolean | null;
  expenditurePerCapita: MetricResult;
}

const NOT_YET_IMPORTED = "Deze gegevens zijn nog niet geïmporteerd.";
const OVERVIEW_METRIC_CODES = ["government_revenue", "government_expenditure", "net_lending_borrowing"];

export async function getBelgiumOverview(entitySlug = "belgie"): Promise<BelgiumOverviewData> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) {
    return {
      year: null,
      revenue: { available: false, reason: NOT_YET_IMPORTED },
      expenditure: { available: false, reason: NOT_YET_IMPORTED },
      balance: { available: false, reason: NOT_YET_IMPORTED },
      balanceIsDeficit: null,
      expenditurePerCapita: { available: false, reason: NOT_YET_IMPORTED },
    };
  }

  // Use one single common year for revenue/expenditure/balance so the cards
  // never silently mix e.g. 2025 revenue with 2024 expenditure.
  const common = await getLatestCommonAnnualPeriod(entity.id, OVERVIEW_METRIC_CODES);
  if (!common) {
    return {
      year: null,
      revenue: { available: false, reason: NOT_YET_IMPORTED },
      expenditure: { available: false, reason: NOT_YET_IMPORTED },
      balance: { available: false, reason: NOT_YET_IMPORTED },
      balanceIsDeficit: null,
      expenditurePerCapita: { available: false, reason: NOT_YET_IMPORTED },
    };
  }

  const [revenue, expenditure, balance] = await Promise.all([
    getNationalTotalMetric(entity.id, "government_revenue", common.year),
    getNationalTotalMetric(entity.id, "government_expenditure", common.year),
    getNationalTotalMetric(entity.id, "net_lending_borrowing", common.year),
  ]);

  const balanceIsDeficit =
    balance.available && Number(balance.rawValue) < 0 ? true : balance.available ? false : null;

  const expenditurePerCapita = await getExpenditurePerCapitaMetric(entitySlug, common.year);

  return { year: common.year, revenue, expenditure, balance, balanceIsDeficit, expenditurePerCapita };
}

async function getNationalTotalMetric(entityId: string, metricCode: string, year: number): Promise<MetricResult> {
  const observation = await prisma.observation.findFirst({
    where: { entityId, metric: { code: metricCode }, classificationItemId: null, period: { year, periodType: "YEAR" } },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
  });
  if (!observation) return { available: false, reason: NOT_YET_IMPORTED };

  const value = new Decimal(observation.value.toString()).mul(observation.unit.scaleFactor.toString());
  return {
    available: true,
    value: formatCurrency(value),
    rawValue: value.toString(),
    unit: observation.unit.code,
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

async function getExpenditurePerCapitaMetric(entitySlug: string, year: number): Promise<MetricResult> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, reason: NOT_YET_IMPORTED };

  const [expenditureObservation, populationObservation] = await Promise.all([
    prisma.observation.findFirst({
      where: { entityId: entity.id, metric: { code: "government_expenditure" }, classificationItemId: null, period: { year, periodType: "YEAR" } },
      include: { unit: true, period: true },
    }),
    prisma.observation.findFirst({
      where: { entityId: entity.id, metric: { code: "population" }, period: { year: { lte: year } } },
      include: { unit: true, period: true, source: { include: { organisation: true } } },
      orderBy: { period: { year: "desc" } },
    }),
  ]);
  if (!expenditureObservation || !populationObservation) return { available: false, reason: NOT_YET_IMPORTED };

  const population = new Decimal(populationObservation.value.toString()).mul(populationObservation.unit.scaleFactor.toString());
  if (population.lte(0)) return { available: false, reason: "Ongeldige bevolkingswaarde." };

  const expenditure = new Decimal(expenditureObservation.value.toString()).mul(expenditureObservation.unit.scaleFactor.toString());
  const perCapita = expenditure.div(population);

  return {
    available: true,
    value: formatPerCapita(perCapita),
    rawValue: perCapita.toString(),
    unit: "EUR_PER_CAPITA",
    period: expenditureObservation.period.label,
    status: toDisplayStatus(expenditureObservation.status),
    source: {
      organisation: populationObservation.source.organisation.name,
      dataset: populationObservation.source.name,
      datasetUrl: populationObservation.source.landingPageUrl ?? undefined,
      period: populationObservation.period.label,
      publishedAt: populationObservation.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(populationObservation.status),
    },
  };
}

// ============================================================
// Debt history (time series)
// ============================================================

export interface DebtHistoryPoint {
  period: string;
  year: number;
  quarter: number | null;
  value: string; // raw EUR
  status: string;
}

export interface DebtHistoryData {
  available: boolean;
  points: DebtHistoryPoint[];
  source: SourceReference | null;
}

export async function getDebtHistory(entitySlug = "belgie"): Promise<DebtHistoryData> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, points: [], source: null };

  const observations = await prisma.observation.findMany({
    where: { entityId: entity.id, metric: { code: "government_debt" } },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: [{ period: { year: "asc" } }, { period: { quarter: "asc" } }],
  });

  if (observations.length === 0) return { available: false, points: [], source: null };

  const points: DebtHistoryPoint[] = observations.map((o) => ({
    period: o.period.label,
    year: o.period.year,
    quarter: o.period.quarter,
    value: new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()).toString(),
    status: o.status,
  }));

  const last = observations[observations.length - 1]!;
  return {
    available: true,
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

// ============================================================
// International comparison
// ============================================================

export interface CountryDebtComparisonPoint {
  entitySlug: string;
  entityName: string;
  isHighlighted: boolean;
  value: string; // raw EUR
  period: string;
  status: string;
}

export interface InternationalComparisonData {
  available: boolean;
  metricLabel: string;
  points: CountryDebtComparisonPoint[];
  source: SourceReference | null;
}

const DEFAULT_COMPARISON_SLUGS = ["belgie", "nederland", "frankrijk", "duitsland", "eu27"];

export async function getInternationalComparison(
  entitySlugs: string[] = DEFAULT_COMPARISON_SLUGS,
): Promise<InternationalComparisonData> {
  const entities = await prisma.governmentEntity.findMany({ where: { slug: { in: entitySlugs } } });
  if (entities.length === 0) return { available: false, metricLabel: "", points: [], source: null };

  // Latest common period across the requested entities avoids silently
  // mixing e.g. Belgium Q1 2026 with a country still only reporting 2025.
  const latestPeriodPerEntity = await Promise.all(
    entities.map((entity) =>
      prisma.observation.findFirst({
        where: { entityId: entity.id, metric: { code: "government_debt" } },
        orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
        include: { period: true },
      }),
    ),
  );

  // Use Belgium's latest reported period as the comparison anchor, and only
  // include entities that also report that *exact* period — rather than
  // silently mixing e.g. Belgium Q1 2026 with a country still on Q4 2025.
  const belgiumIndex = entities.findIndex((e) => e.slug === "belgie");
  const targetPeriodLabel = latestPeriodPerEntity[belgiumIndex]?.period.label
    ?? latestPeriodPerEntity.find((o) => o !== null)?.period.label;
  if (!targetPeriodLabel) return { available: false, metricLabel: "", points: [], source: null };

  const observations = await prisma.observation.findMany({
    where: {
      entityId: { in: entities.map((e) => e.id) },
      metric: { code: "government_debt" },
      period: { label: targetPeriodLabel },
    },
    include: { unit: true, period: true, entity: true, source: { include: { organisation: true } } },
  });

  if (observations.length === 0) return { available: false, metricLabel: "", points: [], source: null };

  const points: CountryDebtComparisonPoint[] = observations
    .map((o) => ({
      entitySlug: o.entity.slug,
      entityName: o.entity.name,
      isHighlighted: o.entity.slug === "belgie",
      value: new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()).toString(),
      period: o.period.label,
      status: o.status,
    }))
    .sort((a, b) => Number(b.value) - Number(a.value));

  const first = observations[0]!;
  return {
    available: true,
    metricLabel: "Overheidsschuld (Maastrichtschuld)",
    points,
    source: {
      organisation: first.source.organisation.name,
      dataset: first.source.name,
      datasetUrl: first.source.landingPageUrl ?? undefined,
      period: targetPeriodLabel,
      publishedAt: first.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(first.status),
    },
  };
}

// ============================================================
// Latest data updates
// ============================================================

export interface DataUpdateItem {
  id: string;
  datasetName: string;
  organisation: string;
  latestPeriod: string | null;
  completedAt: string | null;
  recordsCreated: number;
  recordsUpdated: number;
}

export async function getLatestDataUpdates(limit = 5): Promise<DataUpdateItem[]> {
  const runs = await prisma.importRun.findMany({
    where: { status: { in: ["SUCCESS", "PARTIAL_SUCCESS"] }, OR: [{ recordsCreated: { gt: 0 } }, { recordsUpdated: { gt: 0 } }] },
    include: { dataset: { include: { organisation: true } } },
    orderBy: { completedAt: "desc" },
    take: limit,
  });

  return runs.map((run) => ({
    id: run.id,
    datasetName: run.dataset.name,
    organisation: run.dataset.organisation.name,
    latestPeriod: run.dataset.latestAvailablePeriod,
    completedAt: run.completedAt?.toISOString() ?? null,
    recordsCreated: run.recordsCreated,
    recordsUpdated: run.recordsUpdated,
  }));
}
