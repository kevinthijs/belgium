import Decimal from "decimal.js";

export interface RevisionDiff {
  absoluteDifference: Decimal | null;
  percentageDifference: Decimal | null;
}

/** Never divides by zero and never reports a percentage change when there's
 * no previous value to compare against (a brand-new observation isn't a
 * revision of anything). */
export function computeRevisionDiff(previousValue: Decimal | string | number | null, newValue: Decimal | string | number): RevisionDiff {
  const previous = previousValue !== null ? new Decimal(previousValue.toString()) : null;
  const next = new Decimal(newValue.toString());
  const absoluteDifference = previous ? next.minus(previous) : null;
  const percentageDifference = previous && !previous.isZero() ? absoluteDifference!.div(previous).mul(100) : null;
  return { absoluteDifference, percentageDifference };
}
