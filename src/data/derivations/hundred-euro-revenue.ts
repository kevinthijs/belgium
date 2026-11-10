import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { computeHundredEuroShares, type HundredEuroCategory } from "./hundred-euro-expenditure";

export interface HundredEuroRevenueResult {
  year: number;
  totalRevenueEUR: Decimal;
  categories: HundredEuroCategory[];
  residualEUR: Decimal;
  residualNote: string;
}

const TAX_METRIC_CODES = ["taxes_production_imports", "taxes_vat", "taxes_income", "social_contributions", "capital_taxes"] as const;

/**
 * "Waar komt €100 overheidsgeld vandaan?" — reconciled against TOTAL
 * REVENUE (gov_10a_main TR), never against total taxes: gov_10a_taxag
 * explains taxation, which is only a *subset* of total government revenue
 * (non-tax income — fees, property income, EU transfers, ... — is not
 * covered by it).
 *
 * Categories (all raw Eurostat gov_10a_taxag series, no invented splits):
 *  - VAT                                    = D211
 *  - Other taxes on production/imports      = D2 − D211   (subtraction of
 *    two official series; D2 is "taxes on production and imports" and
 *    D211 "VAT" is a documented subset of it)
 *  - Taxes on income                        = D5
 *  - Social contributions                   = D61
 *  - Capital taxes                          = D91
 *  - "Overige niet-fiscale ontvangsten"      = TR − (D2 + D5 + D61 + D91)
 *    — a mathematically-defined residual, never itself a source series.
 *    A materially negative residual would indicate a methodological
 *    incompatibility between the two datasets for that year and is
 *    surfaced as-is rather than "corrected".
 */
export async function getHundredEuroRevenue(entitySlug = "belgie"): Promise<HundredEuroRevenueResult | null> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return null;

  const taxObservations = await prisma.observation.findMany({
    where: {
      entityId: entity.id,
      metric: { code: { in: [...TAX_METRIC_CODES] } },
      classificationItemId: null,
      period: { periodType: "YEAR" },
    },
    include: { unit: true, period: true, metric: true },
    orderBy: { period: { year: "desc" } },
  });
  if (taxObservations.length === 0) return null;

  // Find the latest year that has ALL five tax categories present.
  const byYear = new Map<number, Map<string, Decimal>>();
  for (const o of taxObservations) {
    const year = o.period.year;
    const value = new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString());
    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year)!.set(o.metric.code, value);
  }
  const completeYears = [...byYear.entries()]
    .filter(([, m]) => TAX_METRIC_CODES.every((code) => m.has(code)))
    .map(([year]) => year)
    .sort((a, b) => b - a);
  if (completeYears.length === 0) return null;
  const year = completeYears[0]!;
  const taxes = byYear.get(year)!;

  const totalRevenueObservation = await prisma.observation.findFirst({
    where: {
      entityId: entity.id,
      metric: { code: "government_revenue" },
      classificationItemId: null,
      period: { year, periodType: "YEAR" },
    },
    include: { unit: true },
  });
  if (!totalRevenueObservation) return null;

  const totalRevenueEUR = new Decimal(totalRevenueObservation.value.toString()).mul(
    totalRevenueObservation.unit.scaleFactor.toString(),
  );

  const vat = taxes.get("taxes_vat")!;
  const productionImports = taxes.get("taxes_production_imports")!;
  const income = taxes.get("taxes_income")!;
  const socialContributions = taxes.get("social_contributions")!;
  const capitalTaxes = taxes.get("capital_taxes")!;

  const categories = [
    { code: "D211", label: "Btw", valueEUR: vat },
    { code: "D2_MINUS_D211", label: "Overige belastingen op productie en invoer", valueEUR: productionImports.minus(vat) },
    { code: "D5", label: "Belastingen op inkomen", valueEUR: income },
    { code: "D61", label: "Sociale bijdragen", valueEUR: socialContributions },
    { code: "D91", label: "Vermogensbelastingen", valueEUR: capitalTaxes },
  ];

  const mappedTotal = productionImports.plus(income).plus(socialContributions).plus(capitalTaxes);
  const residualEUR = totalRevenueEUR.minus(mappedTotal);

  const allCategories = [
    ...categories,
    { code: "RESIDUAL", label: "Overige niet-fiscale ontvangsten", valueEUR: residualEUR },
  ];

  return {
    year,
    totalRevenueEUR,
    categories: computeHundredEuroShares(allCategories, totalRevenueEUR),
    residualEUR,
    residualNote: "Totale ontvangsten (TR) minus D2 (productie/invoer) + D5 (inkomen) + D61 (sociale bijdragen) + D91 (vermogen), volgens Eurostat gov_10a_main en gov_10a_taxag.",
  };
}
