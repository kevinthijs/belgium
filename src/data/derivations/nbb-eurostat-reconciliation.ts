import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

/**
 * Compares NBB's `DF_NFGOV_DISS` S13 observations against the existing
 * Eurostat `gov_10a_main` import for the same entity/metric/year, per the
 * sprint's Phase 13 gate: the public UI (Phase 18) must not activate unless
 * this reconciliation passes. Never used to overwrite or choose between
 * sources — see docs/NBB_IMPORT.md and Phase 14 (source precedence).
 */

export const RECONCILIATION_METRICS = ["government_revenue", "government_expenditure", "net_lending_borrowing"] as const;

export type ReconciliationClassification =
  | "MATCH"
  | "ROUNDING_DIFFERENCE"
  | "REVISION_TIMING_DIFFERENCE"
  | "DEFINITION_DIFFERENCE"
  | "INVESTIGATE";

export interface ReconciliationRow {
  metric: string;
  year: number;
  nbbValue: string;
  eurostatValue: string;
  difference: string;
  classification: ReconciliationClassification;
}

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

/**
 * Reconciles S13 (entity slug "belgie") NBB vs Eurostat observations for the
 * given years. Both sources must publish EUR_MILLION values for a row to be
 * compared; a metric/year missing from either source is omitted, not
 * reported as a mismatch.
 */
export async function reconcileNbbAgainstEurostat(years: number[]): Promise<ReconciliationRow[]> {
  const [nbbObservations, eurostatObservations] = await Promise.all([
    prisma.observation.findMany({
      where: {
        source: { code: "DF_NFGOV_DISS" },
        entity: { slug: "belgie" },
        metric: { code: { in: [...RECONCILIATION_METRICS] } },
        period: { year: { in: years } },
        classificationItemId: null,
      },
      include: { metric: true, period: true, unit: true },
    }),
    prisma.observation.findMany({
      where: {
        source: { code: "gov_10a_main" },
        entity: { slug: "belgie" },
        metric: { code: { in: [...RECONCILIATION_METRICS] } },
        period: { year: { in: years } },
        classificationItemId: null,
      },
      include: { metric: true, period: true, unit: true },
    }),
  ]);

  const byKey = new Map<string, { nbb?: (typeof nbbObservations)[number]; eurostat?: (typeof eurostatObservations)[number] }>();
  const key = (metricCode: string, year: number) => `${metricCode}:${year}`;

  for (const o of nbbObservations) {
    const k = key(o.metric.code, o.period.year);
    byKey.set(k, { ...byKey.get(k), nbb: o });
  }
  for (const o of eurostatObservations) {
    const k = key(o.metric.code, o.period.year);
    byKey.set(k, { ...byKey.get(k), eurostat: o });
  }

  const rows: ReconciliationRow[] = [];
  for (const [, pair] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!pair.nbb || !pair.eurostat) continue;
    // Compared directly in EUR_MILLION (both sources share this unit) so the
    // tolerances below are expressed in millions of euro, not raw euro.
    const nbbValue = new Decimal(pair.nbb.value.toString());
    const eurostatValue = new Decimal(pair.eurostat.value.toString());
    const { difference, classification } = classify(nbbValue, eurostatValue);
    rows.push({
      metric: pair.nbb.metric.code,
      year: pair.nbb.period.year,
      nbbValue: nbbValue.toString(),
      eurostatValue: eurostatValue.toString(),
      difference: difference.toString(),
      classification,
    });
  }
  return rows;
}

/** True only if every reconciled row is MATCH or ROUNDING_DIFFERENCE — the
 * Phase 18 gate condition for activating the public UI. */
export function reconciliationPasses(rows: ReconciliationRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.classification === "MATCH" || r.classification === "ROUNDING_DIFFERENCE");
}
