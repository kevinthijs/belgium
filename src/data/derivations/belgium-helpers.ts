import Decimal from "decimal.js";

/**
 * Statbel population is a Jan-1 stock, reported per year. Given a map of
 * year -> population and a target year, returns the population for that
 * exact year, or falls back to the most recent prior year — never a future
 * one, and never a fabricated value (returns null if nothing qualifies).
 */
export function selectPopulationForYear(populationByYear: Map<number, Decimal>, targetYear: number): Decimal | null {
  if (populationByYear.has(targetYear)) return populationByYear.get(targetYear)!;
  const priorYears = [...populationByYear.keys()].filter((y) => y <= targetYear).sort((a, b) => b - a);
  if (priorYears.length === 0) return null;
  return populationByYear.get(priorYears[0]!) ?? null;
}

/** Percentage share of `value` within `total`, rounded to one decimal. Throws on a non-positive total. */
export function computeShareOfTotal(value: Decimal, total: Decimal): Decimal {
  if (total.lte(0)) {
    throw new Error("Cannot compute a share of a non-positive total");
  }
  return value.div(total).mul(100).toDecimalPlaces(1);
}

export interface ComparableRow {
  debtToGdp: { available: boolean; rawValue?: string };
}

/** Sorts comparison rows by descending debt/GDP ratio; rows without data sink to the bottom, order preserved among them. */
export function sortByDebtToGdpDescending<T extends ComparableRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const av = a.debtToGdp.available ? Number(a.debtToGdp.rawValue) : -Infinity;
    const bv = b.debtToGdp.available ? Number(b.debtToGdp.rawValue) : -Infinity;
    return bv - av;
  });
}
