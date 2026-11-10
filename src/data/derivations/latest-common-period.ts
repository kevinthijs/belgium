import { prisma } from "@/lib/prisma";

/**
 * Finds the most recent annual (YEAR-period) year for which *every* given
 * metric has a national-total observation (classificationItemId: null) for
 * the entity. Used to avoid mixing years on the homepage overview — e.g.
 * showing 2025 revenue next to 2024 expenditure just because one series was
 * published later than the other.
 *
 * Returns null if the metrics share no common year at all.
 */
export async function getLatestCommonAnnualPeriod(
  entityId: string,
  metricCodes: string[],
): Promise<{ year: number } | null> {
  if (metricCodes.length === 0) return null;

  const yearsPerMetric = await Promise.all(
    metricCodes.map(async (code) => {
      const observations = await prisma.observation.findMany({
        where: {
          entityId,
          metric: { code },
          classificationItemId: null,
          period: { periodType: "YEAR" },
        },
        select: { period: { select: { year: true } } },
      });
      return new Set(observations.map((o) => o.period.year));
    }),
  );

  const [first, ...rest] = yearsPerMetric;
  if (!first) return null;

  const common = [...first].filter((year) => rest.every((years) => years.has(year)));
  if (common.length === 0) return null;

  return { year: Math.max(...common) };
}
