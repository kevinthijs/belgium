import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

/**
 * Computes a LINEAR_RECENT_DEBT_CHANGE debt estimate model from the two
 * most recent official quarterly debt observations for an entity, and
 * persists it. This runs after an import (not on every page view / every
 * second) — the frontend animates locally between stored reference points.
 */
export interface LinearChangeEstimate {
  quarterlyChange: Decimal;
  annualizedChange: Decimal;
  dailyChange: Decimal;
}

/** Pure calculation, kept separate from persistence so it's directly unit-testable. */
export function computeLinearChangeEstimate(previousValue: Decimal, latestValue: Decimal): LinearChangeEstimate {
  const quarterlyChange = latestValue.minus(previousValue);
  const annualizedChange = quarterlyChange.mul(4);
  const dailyChange = annualizedChange.div(365);
  return { quarterlyChange, annualizedChange, dailyChange };
}

export async function computeLinearRecentDebtChangeEstimate(entitySlug: string) {
  const entity = await prisma.governmentEntity.findUniqueOrThrow({ where: { slug: entitySlug } });
  const debtMetric = await prisma.metric.findUniqueOrThrow({ where: { code: "government_debt" } });

  const recentObservations = await prisma.observation.findMany({
    where: { entityId: entity.id, metricId: debtMetric.id },
    include: { period: true, unit: true },
    orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
    take: 2,
  });

  if (recentObservations.length < 2) {
    throw new Error(`Not enough observations to build a debt estimate for "${entitySlug}"`);
  }

  const [latest, previous] = recentObservations as [
    (typeof recentObservations)[number],
    (typeof recentObservations)[number],
  ];

  const latestValue = new Decimal(latest.value.toString()).mul(latest.unit.scaleFactor.toString());
  const previousValue = new Decimal(previous.value.toString()).mul(previous.unit.scaleFactor.toString());
  const { annualizedChange, dailyChange } = computeLinearChangeEstimate(previousValue, latestValue);

  const estimate = await prisma.debtEstimateModel.create({
    data: {
      entityId: entity.id,
      referenceObservationId: latest.id,
      calculationType: "LINEAR_RECENT_DEBT_CHANGE",
      annualizedChange: annualizedChange.toString(),
      dailyChange: dailyChange.toString(),
      validFrom: new Date(),
      sourceObservations: {
        latest: { id: latest.id, period: latest.period.label, value: latestValue.toString() },
        previous: { id: previous.id, period: previous.period.label, value: previousValue.toString() },
      },
      methodologyDescription:
        `Lineaire extrapolatie op basis van de verandering in de Maastrichtschuld tussen ${previous.period.label} en ${latest.period.label} (Eurostat gov_10q_ggdebt), op jaarbasis herrekend (kwartaalverandering x 4).`,
      qualityStatus: "ESTIMATED",
    },
  });

  return estimate;
}
