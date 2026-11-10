import "server-only";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import {
  getOfficialDebtMetric,
  getOfficialDebtToGdpMetric,
  getDebtPerCapitaMetric,
  getPctGdpMetric,
  getBelgiumOverview,
} from "./homepage";
import { getDebtPerCapita, computeDebtPerCapita as computePerCapita } from "@/data/derivations/debt-per-capita";
import { selectPopulationForYear, computeShareOfTotal, sortByDebtToGdpDescending } from "@/data/derivations/belgium-helpers";
import { formatPerCapita, formatCurrency, formatInteger } from "@/lib/format/money";
import { toDisplayStatus } from "./status-labels";
import type { MetricResult, SourceReference } from "./types";

// ============================================================
// Entity profile (page header)
// ============================================================

export interface BelgiumProfile {
  slug: string;
  name: string;
  officialName: string | null;
  sectorCode: string | null;
  sectorName: string | null;
  population: MetricResult;
  latestFinancialYear: number | null;
  latestDebtPeriod: string | null;
}

export async function getBelgiumProfile(entitySlug = "belgie"): Promise<BelgiumProfile | null> {
  const entity = await prisma.governmentEntity.findUnique({
    where: { slug: entitySlug },
    include: { statisticalSector: true },
  });
  if (!entity) return null;

  const [populationObservation, latestDebtObservation, overview] = await Promise.all([
    prisma.observation.findFirst({
      where: { entityId: entity.id, metric: { code: "population" } },
      include: { unit: true, period: true, source: { include: { organisation: true } } },
      orderBy: { period: { year: "desc" } },
    }),
    prisma.observation.findFirst({
      where: { entityId: entity.id, metric: { code: "government_debt" } },
      include: { period: true },
      orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
    }),
    getBelgiumOverview(entitySlug),
  ]);

  let population: MetricResult;
  if (populationObservation) {
    const value = new Decimal(populationObservation.value.toString()).mul(populationObservation.unit.scaleFactor.toString());
    population = {
      available: true,
      value: `${formatInteger(value)} inwoners`,
      rawValue: value.toString(),
      unit: "PERSONS",
      period: populationObservation.period.label,
      status: toDisplayStatus(populationObservation.status),
      source: {
        organisation: populationObservation.source.organisation.name,
        dataset: populationObservation.source.name,
        datasetUrl: populationObservation.source.landingPageUrl ?? undefined,
        period: populationObservation.period.label,
        publishedAt: populationObservation.publishedAt?.toISOString() ?? null,
        status: toDisplayStatus(populationObservation.status),
      },
    };
  } else {
    population = { available: false, reason: "Bevolkingscijfers nog niet geïmporteerd." };
  }

  return {
    slug: entity.slug,
    name: entity.name,
    officialName: entity.officialName,
    sectorCode: entity.statisticalSector?.code ?? null,
    sectorName: entity.statisticalSector?.name ?? null,
    population,
    latestFinancialYear: overview.year,
    latestDebtPeriod: latestDebtObservation?.period.label ?? null,
  };
}

// ============================================================
// Key metrics (six top cards)
// ============================================================

export interface BelgiumKeyMetrics {
  officialDebt: MetricResult;
  debtToGdp: MetricResult;
  debtPerCapita: MetricResult;
  revenue: MetricResult;
  expenditure: MetricResult;
  balance: MetricResult;
  balanceIsDeficit: boolean | null;
  annualYear: number | null;
}

export async function getBelgiumKeyMetrics(entitySlug = "belgie"): Promise<BelgiumKeyMetrics> {
  const [officialDebt, debtToGdp, debtPerCapita, overview] = await Promise.all([
    getOfficialDebtMetric(entitySlug),
    getOfficialDebtToGdpMetric(entitySlug),
    getDebtPerCapitaMetric(entitySlug),
    getBelgiumOverview(entitySlug),
  ]);

  return {
    officialDebt,
    debtToGdp,
    debtPerCapita,
    revenue: overview.revenue,
    expenditure: overview.expenditure,
    balance: overview.balance,
    balanceIsDeficit: overview.balanceIsDeficit,
    annualYear: overview.year,
  };
}

// ============================================================
// Debt history in multiple units — fetched once, unit-switched
// client-side. % BBP and per-inwoner values are only filled in for
// periods where the underlying source data actually exists; they are
// never derived from a differently-sourced GDP figure.
// ============================================================

export interface DebtHistoryUnitPoint {
  period: string;
  year: number;
  quarter: number | null;
  eur: string;
  pctGdp: string | null;
  perCapita: string | null;
  status: string;
}

export interface BelgiumDebtHistoryAllUnits {
  available: boolean;
  points: DebtHistoryUnitPoint[];
  source: SourceReference | null;
}

export async function getBelgiumDebtHistoryAllUnits(entitySlug = "belgie"): Promise<BelgiumDebtHistoryAllUnits> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, points: [], source: null };

  const [debtObservations, pctGdpObservations, populationObservations] = await Promise.all([
    prisma.observation.findMany({
      where: { entityId: entity.id, metric: { code: "government_debt" } },
      include: { unit: true, period: true, source: { include: { organisation: true } } },
      orderBy: [{ period: { year: "asc" } }, { period: { quarter: "asc" } }],
    }),
    prisma.observation.findMany({
      where: { entityId: entity.id, metric: { code: "government_debt_pct_gdp" } },
      include: { unit: true, period: true },
    }),
    prisma.observation.findMany({
      where: { entityId: entity.id, metric: { code: "population" } },
      include: { unit: true, period: true },
      orderBy: { period: { year: "asc" } },
    }),
  ]);
  if (debtObservations.length === 0) return { available: false, points: [], source: null };

  const pctGdpByPeriod = new Map(
    pctGdpObservations.map((o) => [o.period.label, new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString())]),
  );
  const populationByYear = new Map(
    populationObservations.map((o) => [o.period.year, new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString())]),
  );

  const points: DebtHistoryUnitPoint[] = debtObservations.map((o) => {
    const eur = new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString());
    const pctGdp = pctGdpByPeriod.get(o.period.label) ?? null;
    const population = selectPopulationForYear(populationByYear, o.period.year);
    return {
      period: o.period.label,
      year: o.period.year,
      quarter: o.period.quarter,
      eur: eur.toString(),
      pctGdp: pctGdp ? pctGdp.toString() : null,
      perCapita: population && population.gt(0) ? eur.div(population).toString() : null,
      status: o.status,
    };
  });

  const last = debtObservations[debtObservations.length - 1]!;
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
// Tax breakdown (Eurostat gov_10a_taxag categories, as imported —
// no invented Belgian tax names beyond what the source supports)
// ============================================================

export interface TaxCategoryDisplay {
  metricCode: string;
  label: string;
  valueEUR: string;
  shareOfTotalTax: string; // percent, 1 decimal
}

export interface BelgiumTaxBreakdown {
  available: boolean;
  year: number | null;
  totalTaxReceiptsEUR: string | null;
  categories: TaxCategoryDisplay[];
  subcategories: TaxCategoryDisplay[];
  source: SourceReference | null;
  reason?: string;
}

const TAX_CATEGORY_METRICS: Array<{ code: string; label: string }> = [
  { code: "taxes_production_imports", label: "Belastingen op productie en invoer" },
  { code: "taxes_income", label: "Belastingen op inkomen" },
  { code: "social_contributions", label: "Sociale bijdragen" },
  { code: "capital_taxes", label: "Vermogensbelastingen" },
];

const TAX_SUBCATEGORY_METRICS: Array<{ code: string; label: string }> = [
  { code: "taxes_vat", label: "Btw" },
  { code: "taxes_income_personal", label: "Personenbelasting" },
  { code: "taxes_income_corporate", label: "Vennootschapsbelasting" },
];

export async function getBelgiumTaxBreakdown(entitySlug = "belgie"): Promise<BelgiumTaxBreakdown> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) {
    return { available: false, year: null, totalTaxReceiptsEUR: null, categories: [], subcategories: [], source: null, reason: "Onbekende overheid." };
  }

  const allCodes = [
    "total_tax_receipts",
    ...TAX_CATEGORY_METRICS.map((c) => c.code),
    ...TAX_SUBCATEGORY_METRICS.map((c) => c.code),
  ];

  const observations = await prisma.observation.findMany({
    where: { entityId: entity.id, metric: { code: { in: allCodes } }, classificationItemId: null, period: { periodType: "YEAR" } },
    include: { unit: true, period: true, metric: true, source: { include: { organisation: true } } },
    orderBy: { period: { year: "desc" } },
  });
  if (observations.length === 0) {
    return {
      available: false,
      year: null,
      totalTaxReceiptsEUR: null,
      categories: [],
      subcategories: [],
      source: null,
      reason: "Belastingdata (Eurostat gov_10a_taxag) nog niet geïmporteerd.",
    };
  }

  const byYear = new Map<number, Map<string, (typeof observations)[number]>>();
  for (const o of observations) {
    const year = o.period.year;
    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year)!.set(o.metric.code, o);
  }

  // Use the latest year that has the total plus all top-level categories —
  // subcategories (VAT, personal/corporate income tax) are shown only when
  // present for that same year, never backfilled from a different year.
  const requiredCodes = ["total_tax_receipts", ...TAX_CATEGORY_METRICS.map((c) => c.code)];
  const completeYears = [...byYear.entries()]
    .filter(([, m]) => requiredCodes.every((code) => m.has(code)))
    .map(([year]) => year)
    .sort((a, b) => b - a);
  if (completeYears.length === 0) {
    return {
      available: false,
      year: null,
      totalTaxReceiptsEUR: null,
      categories: [],
      subcategories: [],
      source: null,
      reason: "Geen jaar met een volledige set belastingcategorieën gevonden.",
    };
  }
  const year = completeYears[0]!;
  const forYear = byYear.get(year)!;

  const scaled = (o: (typeof observations)[number]) => new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString());
  const total = scaled(forYear.get("total_tax_receipts")!);

  const categories = TAX_CATEGORY_METRICS.map((c) => {
    const o = forYear.get(c.code)!;
    const value = scaled(o);
    return { metricCode: c.code, label: c.label, valueEUR: value.toString(), shareOfTotalTax: computeShareOfTotal(value, total).toString() };
  });

  const subcategories = TAX_SUBCATEGORY_METRICS.filter((c) => forYear.has(c.code)).map((c) => {
    const o = forYear.get(c.code)!;
    const value = scaled(o);
    return { metricCode: c.code, label: c.label, valueEUR: value.toString(), shareOfTotalTax: computeShareOfTotal(value, total).toString() };
  });

  const totalObs = forYear.get("total_tax_receipts")!;
  return {
    available: true,
    year,
    totalTaxReceiptsEUR: total.toString(),
    categories,
    subcategories,
    source: {
      organisation: totalObs.source.organisation.name,
      dataset: totalObs.source.name,
      datasetUrl: totalObs.source.landingPageUrl ?? undefined,
      period: totalObs.period.label,
      publishedAt: totalObs.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(totalObs.status),
    },
  };
}

// ============================================================
// Per-capita finance
// ============================================================

export interface PerCapitaMetrics {
  debtPerCapita: MetricResult;
  revenuePerCapita: MetricResult;
  expenditurePerCapita: MetricResult;
  balancePerCapita: MetricResult;
}

async function getAnnualMetricPerCapita(entitySlug: string, metricCode: string): Promise<MetricResult> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, reason: "Onbekende overheid." };

  const observation = await prisma.observation.findFirst({
    where: { entityId: entity.id, metric: { code: metricCode }, classificationItemId: null, period: { periodType: "YEAR" } },
    include: { unit: true, period: true },
    orderBy: { period: { year: "desc" } },
  });
  if (!observation) return { available: false, reason: "Deze cijfers zijn nog niet geïmporteerd." };

  const populationObservation = await prisma.observation.findFirst({
    where: { entityId: entity.id, metric: { code: "population" }, period: { year: { lte: observation.period.year } } },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: { period: { year: "desc" } },
  });
  if (!populationObservation) return { available: false, reason: "Bevolkingscijfers nog niet geïmporteerd voor dit jaar." };

  const population = new Decimal(populationObservation.value.toString()).mul(populationObservation.unit.scaleFactor.toString());
  if (population.lte(0)) return { available: false, reason: "Ongeldige bevolkingswaarde." };

  const amount = new Decimal(observation.value.toString()).mul(observation.unit.scaleFactor.toString());
  const perCapita = computePerCapita(amount, population);

  return {
    available: true,
    value: formatPerCapita(perCapita),
    rawValue: perCapita.toString(),
    unit: "EUR_PER_CAPITA",
    period: observation.period.label,
    status: toDisplayStatus(observation.status),
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

export async function getBelgiumPerCapitaMetrics(entitySlug = "belgie"): Promise<PerCapitaMetrics> {
  const [debtResult, revenuePerCapita, expenditurePerCapita, balancePerCapita] = await Promise.all([
    getDebtPerCapita(entitySlug),
    getAnnualMetricPerCapita(entitySlug, "government_revenue"),
    getAnnualMetricPerCapita(entitySlug, "government_expenditure"),
    getAnnualMetricPerCapita(entitySlug, "net_lending_borrowing"),
  ]);

  const debtPerCapita: MetricResult = debtResult
    ? {
        available: true,
        value: formatPerCapita(debtResult.valuePerCapita),
        rawValue: debtResult.valuePerCapita.toString(),
        unit: "EUR_PER_CAPITA",
        period: debtResult.debtPeriodLabel,
        status: toDisplayStatus(debtResult.populationStatus),
        source: {
          organisation: debtResult.populationSourceOrganisation,
          dataset: debtResult.populationSourceDataset,
          datasetUrl: debtResult.populationSourceDatasetUrl ?? undefined,
          period: debtResult.populationPeriodLabel,
          publishedAt: debtResult.populationPublishedAt?.toISOString() ?? null,
          status: toDisplayStatus(debtResult.populationStatus),
        },
      }
    : { available: false, reason: "Schuld- of bevolkingscijfers nog niet geïmporteerd." };

  return { debtPerCapita, revenuePerCapita, expenditurePerCapita, balancePerCapita };
}

// ============================================================
// International comparison (debt/GDP is the only metric with a full
// cross-country official series today; others gracefully report
// unavailable per entity rather than being derived/faked)
// ============================================================

export interface ComparisonRow {
  entitySlug: string;
  entityName: string;
  isHighlighted: boolean;
  debtToGdp: MetricResult;
}

export interface BelgiumInternationalComparisonData {
  available: boolean;
  period: string | null;
  rows: ComparisonRow[];
  source: SourceReference | null;
}

const COMPARISON_SLUGS = ["belgie", "nederland", "frankrijk", "duitsland", "eu27"];

export async function getBelgiumInternationalComparison(): Promise<BelgiumInternationalComparisonData> {
  const entities = await prisma.governmentEntity.findMany({ where: { slug: { in: COMPARISON_SLUGS } } });
  if (entities.length === 0) return { available: false, period: null, rows: [], source: null };

  const belgium = entities.find((e) => e.slug === "belgie");
  const anchorObservation = belgium
    ? await prisma.observation.findFirst({
        where: { entityId: belgium.id, metric: { code: "government_debt_pct_gdp" } },
        orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
        include: { period: true },
      })
    : null;
  const targetPeriodLabel = anchorObservation?.period.label ?? null;
  if (!targetPeriodLabel) return { available: false, period: null, rows: [], source: null };

  const observations = await prisma.observation.findMany({
    where: {
      entityId: { in: entities.map((e) => e.id) },
      metric: { code: "government_debt_pct_gdp" },
      period: { label: targetPeriodLabel },
    },
    include: { unit: true, period: true, entity: true, source: { include: { organisation: true } } },
  });

  const byEntity = new Map(observations.map((o) => [o.entityId, o]));

  const rows: ComparisonRow[] = entities
    .map((entity) => {
      const o = byEntity.get(entity.id);
      const debtToGdp: MetricResult = o
        ? {
            available: true,
            value: `${new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()).toDecimalPlaces(1).toString()}%`,
            rawValue: new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()).toString(),
            unit: "PERCENT_GDP",
            period: o.period.label,
            status: toDisplayStatus(o.status),
            source: {
              organisation: o.source.organisation.name,
              dataset: o.source.name,
              datasetUrl: o.source.landingPageUrl ?? undefined,
              period: o.period.label,
              publishedAt: o.publishedAt?.toISOString() ?? null,
              status: toDisplayStatus(o.status),
            },
          }
        : { available: false, reason: "Geen gegevens beschikbaar voor deze periode." };

      return { entitySlug: entity.slug, entityName: entity.name, isHighlighted: entity.slug === "belgie", debtToGdp };
    });
  const sortedRows = sortByDebtToGdpDescending(rows);

  const first = observations[0];
  return {
    available: sortedRows.some((r) => r.debtToGdp.available),
    period: targetPeriodLabel,
    rows: sortedRows,
    source: first
      ? {
          organisation: first.source.organisation.name,
          dataset: first.source.name,
          datasetUrl: first.source.landingPageUrl ?? undefined,
          period: targetPeriodLabel,
          publishedAt: first.publishedAt?.toISOString() ?? null,
          status: toDisplayStatus(first.status),
        }
      : null,
  };
}

export { formatCurrency };
export { getPctGdpMetric };
