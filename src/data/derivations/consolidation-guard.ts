import Decimal from "decimal.js";

/**
 * Explicit protection against S1311+S1312+S1313+S1314 being used as a
 * stand-in for S13. Internal transfers between government subsectors
 * (e.g. federal dotations to regions/communities/social security) are
 * consolidated away in the official S13 aggregate but are NOT eliminated
 * by naively summing the four subsector observations — see
 * docs/CONSOLIDATION.md and docs/GOVERNMENT_SUBSECTORS.md.
 *
 * Any code that needs an S13 figure must query the official S13
 * observation directly (entity slug "belgie", the same entity Eurostat's
 * S13 observations already attach to). This module intentionally does
 * NOT export a "sum the subsectors" helper — its only exports are a
 * documented list of the subsector slugs and a comparison helper used by
 * tests/tooling to prove the two are not simply interchangeable.
 */
export const GOVERNMENT_SUBSECTOR_SLUGS = [
  "federale-overheid",
  "gemeenschappen-en-gewesten",
  "lokale-overheden",
  "sociale-zekerheid",
] as const;

export interface SubsectorSumComparison {
  subsectorSum: Decimal;
  officialS13: Decimal;
  difference: Decimal;
  /** True only when the naive sum happens to equal S13 within `tolerance`
   * — expected to be rare/false in practice because of intergovernmental
   * transfers, and callers must not rely on it being true. */
  matchesWithinTolerance: boolean;
}

/**
 * Compares a caller-supplied sum of the four subsector values against the
 * official S13 value. Never used to *produce* an S13 figure — only to
 * document/verify, in tests, that the two are not interchangeable.
 */
export function compareSubsectorSumToOfficialS13(
  subsectorValues: readonly Decimal[],
  officialS13Value: Decimal,
  tolerance: Decimal = new Decimal(0.5),
): SubsectorSumComparison {
  if (subsectorValues.length !== GOVERNMENT_SUBSECTOR_SLUGS.length) {
    throw new Error(
      `Expected exactly ${GOVERNMENT_SUBSECTOR_SLUGS.length} subsector values (one per ${GOVERNMENT_SUBSECTOR_SLUGS.join(", ")}), got ${subsectorValues.length}`,
    );
  }
  const subsectorSum = subsectorValues.reduce((sum, v) => sum.add(v), new Decimal(0));
  const difference = subsectorSum.sub(officialS13Value).abs();
  return { subsectorSum, officialS13: officialS13Value, difference, matchesWithinTolerance: difference.lte(tolerance) };
}
