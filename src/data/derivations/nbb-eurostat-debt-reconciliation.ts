import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import type { ReconciliationClassification, ReconciliationRow } from "./nbb-eurostat-reconciliation";

/**
 * Compares NBB `DF_CGD` (S1300, entity slug "belgie", metric
 * `government_debt`) against the existing Eurostat `gov_10q_ggdebt` import
 * for the same quarter. Both dataflows are genuinely quarterly, so this is
 * a direct year+quarter match — never an annual-vs-Q4 approximation (that
 * caveat only matters if one side were annual, which DF_CGD is not).
 */

/** Absolute EUR-million tolerance below which a difference is a MATCH. */
const MATCH_TOLERANCE = new Decimal(0.05);
/** Absolute EUR-million tolerance below which a difference is treated as
 * rounding noise rather than a substantive discrepancy. */
const ROUNDING_TOLERANCE = new Decimal(0.5);

function classify(nbb: Decimal, eurostat: Decimal): { difference: Decimal; classification: ReconciliationClassification } {
  const difference = nbb.minus(eurostat);
  const abs = difference.abs();
  if (abs.lte(MATCH_TOLERANCE)) return { difference, classification: "MATCH" };
  if (abs.lte(ROUNDING_TOLERANCE)) return { difference, classification: "ROUNDING_DIFFERENCE" };
  return { difference, classification: "INVESTIGATE" };
}

export interface DebtReconciliationRow extends Omit<ReconciliationRow, "year"> {
  year: number;
  quarter: number;
}

/**
 * Reconciles S1300/"belgie" NBB `DF_CGD` vs Eurostat `gov_10q_ggdebt`
 * `government_debt` observations for the given (year, quarter) pairs. A
 * quarter missing from either source is omitted, not reported as a
 * mismatch.
 */
export async function reconcileNbbDebtAgainstEurostat(
  quarters: Array<{ year: number; quarter: number }>,
): Promise<DebtReconciliationRow[]> {
  const years = [...new Set(quarters.map((q) => q.year))];
  const wanted = new Set(quarters.map((q) => `${q.year}-Q${q.quarter}`));

  const [nbbObservations, eurostatObservations] = await Promise.all([
    prisma.observation.findMany({
      where: {
        source: { code: "DF_CGD" },
        entity: { slug: "belgie" },
        metric: { code: "government_debt" },
        period: { year: { in: years }, periodType: "QUARTER" },
        classificationItemId: null,
      },
      include: { metric: true, period: true, unit: true },
    }),
    prisma.observation.findMany({
      where: {
        source: { code: "gov_10q_ggdebt" },
        entity: { slug: "belgie" },
        metric: { code: "government_debt" },
        period: { year: { in: years }, periodType: "QUARTER" },
        classificationItemId: null,
      },
      include: { metric: true, period: true, unit: true },
    }),
  ]);

  const byKey = new Map<string, { nbb?: (typeof nbbObservations)[number]; eurostat?: (typeof eurostatObservations)[number] }>();
  const key = (year: number, quarter: number) => `${year}-Q${quarter}`;

  for (const o of nbbObservations) {
    if (o.period.quarter == null) continue;
    const k = key(o.period.year, o.period.quarter);
    if (!wanted.has(k)) continue;
    byKey.set(k, { ...byKey.get(k), nbb: o });
  }
  for (const o of eurostatObservations) {
    if (o.period.quarter == null) continue;
    const k = key(o.period.year, o.period.quarter);
    if (!wanted.has(k)) continue;
    byKey.set(k, { ...byKey.get(k), eurostat: o });
  }

  const rows: DebtReconciliationRow[] = [];
  for (const [k, pair] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!pair.nbb || !pair.eurostat) continue;
    const nbbValue = new Decimal(pair.nbb.value.toString());
    const eurostatValue = new Decimal(pair.eurostat.value.toString());
    const { difference, classification } = classify(nbbValue, eurostatValue);
    const [yearStr, quarterStr] = k.split("-Q");
    rows.push({
      metric: pair.nbb.metric.code,
      year: Number(yearStr),
      quarter: Number(quarterStr),
      nbbValue: nbbValue.toString(),
      eurostatValue: eurostatValue.toString(),
      difference: difference.toString(),
      classification,
    });
  }
  return rows;
}

/** True only if every reconciled row is MATCH or ROUNDING_DIFFERENCE. */
export function debtReconciliationPasses(rows: DebtReconciliationRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.classification === "MATCH" || r.classification === "ROUNDING_DIFFERENCE");
}
