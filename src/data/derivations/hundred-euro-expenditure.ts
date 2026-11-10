import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

export interface HundredEuroCategory {
  code: string;
  label: string;
  valueEUR: Decimal;
  share: Decimal; // 0..1
  amountPer100: Decimal; // share * 100, in euro
}

/**
 * Pure calculation: given a compatible total and a set of category values
 * (already the same unit, same period, same accounting framework), returns
 * each category's share of that total and its "per €100" amount, sorted
 * descending by value.
 *
 * Deliberately does NOT force the amounts to sum to exactly €100 — real
 * rounding of independently-displayed category amounts can legitimately
 * total €99.99 or €100.01, and inventing a synthetic "other" category to
 * paper over that would misrepresent the source data.
 */
export function computeHundredEuroShares(
  categories: Array<{ code: string; label: string; valueEUR: Decimal }>,
  totalEUR: Decimal,
): HundredEuroCategory[] {
  if (totalEUR.lte(0)) {
    throw new Error("computeHundredEuroShares requires a positive compatible total");
  }
  return categories
    .map((c) => {
      const share = c.valueEUR.div(totalEUR);
      return { ...c, share, amountPer100: share.mul(100) };
    })
    .sort((a, b) => b.valueEUR.comparedTo(a.valueEUR));
}

export interface HundredEuroExpenditureResult {
  year: number;
  totalExpenditureEUR: Decimal;
  categories: HundredEuroCategory[];
}

/**
 * "Waar gaat €100 overheidsgeld naartoe?" — COFOG level-I shares of total
 * general government (S13) expenditure, for the latest year that has both
 * a total-expenditure observation (gov_10a_main TE) and COFOG category
 * observations (gov_10a_exp). Uses Eurostat's own S13 total directly, never
 * a sum of COFOG categories or of government subsectors (see
 * gov-10a-exp-adapter.ts's consolidation note).
 */
export async function getHundredEuroExpenditure(entitySlug = "belgie"): Promise<HundredEuroExpenditureResult | null> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return null;

  const cofogObservations = await prisma.observation.findMany({
    where: {
      entityId: entity.id,
      metric: { code: "government_expenditure" },
      classificationItemId: { not: null },
    },
    include: { unit: true, period: true, classificationItem: true },
    orderBy: { period: { year: "desc" } },
  });
  if (cofogObservations.length === 0) return null;

  const latestCofogYear = cofogObservations[0]!.period.year;
  const categoriesForYear = cofogObservations.filter((o) => o.period.year === latestCofogYear);

  const totalObservation = await prisma.observation.findFirst({
    where: {
      entityId: entity.id,
      metric: { code: "government_expenditure" },
      classificationItemId: null,
      period: { year: latestCofogYear, periodType: "YEAR" },
    },
    include: { unit: true },
  });
  if (!totalObservation) return null; // no compatible total for this year — report unavailable, don't guess

  const totalExpenditureEUR = new Decimal(totalObservation.value.toString()).mul(
    totalObservation.unit.scaleFactor.toString(),
  );

  const categories = categoriesForYear.map((o) => ({
    code: o.classificationItem!.code,
    label: o.classificationItem!.name,
    valueEUR: new Decimal(o.value.toString()).mul(o.unit.scaleFactor.toString()),
  }));

  return {
    year: latestCofogYear,
    totalExpenditureEUR,
    categories: computeHundredEuroShares(categories, totalExpenditureEUR),
  };
}
