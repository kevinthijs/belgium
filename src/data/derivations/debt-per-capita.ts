import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

/** Pure calculation, kept separate from persistence so it's directly unit-testable. */
export function computeDebtPerCapita(debtValueEUR: Decimal, population: Decimal): Decimal {
  if (population.isZero()) {
    throw new Error("Cannot divide debt by a zero population");
  }
  return debtValueEUR.div(population);
}

export interface DebtPerCapitaResult {
  valuePerCapita: Decimal;
  debtValueEUR: Decimal;
  population: Decimal;
  debtPeriodLabel: string;
  populationPeriodLabel: string;
  populationReferenceDate: Date | null;
  populationStatus: string;
  populationPublishedAt: Date | null;
  populationSourceOrganisation: string;
  populationSourceDataset: string;
  populationSourceDatasetUrl: string | null;
}

/**
 * Statbel's legal population is a Jan-1 stock (DATE period); the debt
 * series is quarterly. There's no calendar-exact match between the two —
 * the documented matching rule is: use the population observation whose
 * period.year equals the debt observation's period.year (i.e. the
 * population measured at the start of the same calendar year the debt
 * figure falls in). If no population observation exists for that exact
 * year, fall back to the most recent population year at or before the
 * debt year — never a future one, and never a fabricated value.
 */
export async function getDebtPerCapita(entitySlug: string): Promise<DebtPerCapitaResult | null> {
  const entity = await prisma.governmentEntity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return null;

  const debtObservation = await prisma.observation.findFirst({
    where: { entityId: entity.id, metric: { code: "government_debt" } },
    include: { unit: true, period: true },
    orderBy: [{ period: { year: "desc" } }, { period: { quarter: "desc" } }],
  });
  if (!debtObservation) return null;

  const populationObservation = await prisma.observation.findFirst({
    where: {
      entityId: entity.id,
      metric: { code: "population" },
      period: { year: { lte: debtObservation.period.year } },
    },
    include: { unit: true, period: true, source: { include: { organisation: true } } },
    orderBy: { period: { year: "desc" } },
  });
  if (!populationObservation) return null;

  const debtValueEUR = new Decimal(debtObservation.value.toString()).mul(debtObservation.unit.scaleFactor.toString());
  const population = new Decimal(populationObservation.value.toString()).mul(
    populationObservation.unit.scaleFactor.toString(),
  );

  const valuePerCapita = computeDebtPerCapita(debtValueEUR, population);

  return {
    valuePerCapita,
    debtValueEUR,
    population,
    debtPeriodLabel: debtObservation.period.label,
    populationPeriodLabel: populationObservation.period.label,
    populationReferenceDate: populationObservation.period.referenceDate,
    populationStatus: populationObservation.status,
    populationPublishedAt: populationObservation.publishedAt,
    populationSourceOrganisation: populationObservation.source.organisation.name,
    populationSourceDataset: populationObservation.source.name,
    populationSourceDatasetUrl: populationObservation.source.landingPageUrl,
  };
}
