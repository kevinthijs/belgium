import "server-only";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { getHundredEuroExpenditure as computeHundredEuroExpenditure } from "@/data/derivations/hundred-euro-expenditure";
import { getHundredEuroRevenue as computeHundredEuroRevenue } from "@/data/derivations/hundred-euro-revenue";
import { formatCurrency, formatCompactCurrency } from "@/lib/format/money";
import { toDisplayStatus } from "./status-labels";
import type { SourceReference } from "./types";

// ============================================================
// Revenue / expenditure / balance history
// ============================================================

export interface AnnualHistoryPoint {
  year: number;
  value: string; // raw EUR
  status: string;
}

export interface AnnualHistoryData {
  available: boolean;
  points: AnnualHistoryPoint[];
  source: SourceReference | null;
}

async function getAnnualHistory(metricCode: string, entitySlug: string): Promise<AnnualHistoryData> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, points: [], source: null };

  const observations = await prisma.observation.findMany({
    where: { entityId: entity.id, metric: { code: metricCode }, classificationItemId: null, period: { periodType: "YEAR" } },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: { period: { year: "asc" } },
  });
  if (observations.length === 0) return { available: false, points: [], source: null };

  const points = observations.map((o) => ({
    year: o.period.year,
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
      period: `${points[0]!.year} – ${last.period.label}`,
      publishedAt: last.publishedAt?.toISOString() ?? null,
      status: toDisplayStatus(last.status),
    },
  };
}

export function getBelgiumRevenueHistory(entitySlug = "belgie"): Promise<AnnualHistoryData> {
  return getAnnualHistory("government_revenue", entitySlug);
}

export function getBelgiumExpenditureHistory(entitySlug = "belgie"): Promise<AnnualHistoryData> {
  return getAnnualHistory("government_expenditure", entitySlug);
}

export function getBelgiumBalanceHistory(entitySlug = "belgie"): Promise<AnnualHistoryData> {
  return getAnnualHistory("net_lending_borrowing", entitySlug);
}

// ============================================================
// COFOG breakdown / history
// ============================================================

export interface CofogCategoryDisplay {
  code: string;
  label: string;
  valueEUR: string;
  share: string; // "12.3" (percent, 1 decimal, string)
  amountPer100: string; // "€ 12,30"
}

export interface CofogBreakdownData {
  available: boolean;
  year: number | null;
  totalExpenditureEUR: string | null;
  categories: CofogCategoryDisplay[];
  reason?: string;
}

export async function getBelgiumCofogBreakdown(entitySlug = "belgie"): Promise<CofogBreakdownData> {
  const result = await computeHundredEuroExpenditure(entitySlug);
  if (!result) {
    return { available: false, year: null, totalExpenditureEUR: null, categories: [], reason: "COFOG-uitgavendata nog niet geïmporteerd." };
  }
  return {
    available: true,
    year: result.year,
    totalExpenditureEUR: result.totalExpenditureEUR.toString(),
    categories: result.categories.map((c) => ({
      code: c.code,
      label: c.label,
      valueEUR: c.valueEUR.toString(),
      share: c.share.mul(100).toDecimalPlaces(1).toString(),
      amountPer100: formatCurrency2(c.amountPer100),
    })),
  };
}

export interface CofogHistoryPoint {
  year: number;
  valueEUR: string;
}

export interface CofogHistorySeries {
  code: string;
  label: string;
  points: CofogHistoryPoint[];
}

export interface CofogHistoryData {
  available: boolean;
  series: CofogHistorySeries[];
}

export async function getBelgiumCofogHistory(entitySlug = "belgie"): Promise<CofogHistoryData> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return { available: false, series: [] };

  const observations = await prisma.observation.findMany({
    where: { entityId: entity.id, metric: { code: "government_expenditure" }, classificationItemId: { not: null } },
    include: { unit: true, period: true, classificationItem: true },
    orderBy: [{ classificationItem: { code: "asc" } }, { period: { year: "asc" } }],
  });
  if (observations.length === 0) return { available: false, series: [] };

  const byCode = new Map<string, CofogHistorySeries>();
  for (const o of observations) {
    const code = o.classificationItem!.code;
    if (!byCode.has(code)) byCode.set(code, { code, label: o.classificationItem!.name, points: [] });
    byCode.get(code)!.points.push({
      year: o.period.year,
      valueEUR: new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()).toString(),
    });
  }

  return { available: true, series: [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code)) };
}

// ============================================================
// €100 revenue breakdown
// ============================================================

export interface HundredEuroDisplayCategory {
  code: string;
  label: string;
  valueEUR: string;
  share: string;
  amountPer100: string;
}

export interface HundredEuroRevenueData {
  available: boolean;
  year: number | null;
  totalRevenueEUR: string | null;
  categories: HundredEuroDisplayCategory[];
  residualNote?: string;
  reason?: string;
}

export async function getHundredEuroRevenue(entitySlug = "belgie"): Promise<HundredEuroRevenueData> {
  const result = await computeHundredEuroRevenue(entitySlug);
  if (!result) {
    return {
      available: false,
      year: null,
      totalRevenueEUR: null,
      categories: [],
      reason: "Belastingdata (gov_10a_taxag) of totale-ontvangstendata (gov_10a_main) nog niet volledig geïmporteerd voor een gemeenschappelijk jaar.",
    };
  }
  return {
    available: true,
    year: result.year,
    totalRevenueEUR: result.totalRevenueEUR.toString(),
    categories: result.categories.map((c) => ({
      code: c.code,
      label: c.label,
      valueEUR: c.valueEUR.toString(),
      share: c.share.mul(100).toDecimalPlaces(1).toString(),
      amountPer100: formatCurrency2(c.amountPer100),
    })),
    residualNote: result.residualNote,
  };
}

export async function getHundredEuroExpenditure(entitySlug = "belgie"): Promise<HundredEuroRevenueData> {
  const result = await computeHundredEuroExpenditure(entitySlug);
  if (!result) {
    return {
      available: false,
      year: null,
      totalRevenueEUR: null,
      categories: [],
      reason: "COFOG-uitgavendata (gov_10a_exp) of totale-uitgavendata (gov_10a_main) nog niet volledig geïmporteerd voor een gemeenschappelijk jaar.",
    };
  }
  return {
    available: true,
    year: result.year,
    totalRevenueEUR: result.totalExpenditureEUR.toString(),
    categories: result.categories.map((c) => ({
      code: c.code,
      label: c.label,
      valueEUR: c.valueEUR.toString(),
      share: c.share.mul(100).toDecimalPlaces(1).toString(),
      amountPer100: formatCurrency2(c.amountPer100),
    })),
  };
}

function formatCurrency2(value: Decimal): string {
  return `€ ${value.toDecimalPlaces(2).toFixed(2).replace(".", ",")}`;
}

export { formatCurrency, formatCompactCurrency };
