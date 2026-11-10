/**
 * Guards against misleading comparisons (e.g. Flemish BBC debt vs Belgian
 * Maastricht debt). Two observations may only be compared once their
 * metric, unit, accounting framework, consolidation status and period
 * frequency are checked — never on the basis of "both are numbers about
 * debt".
 */

export type ComparabilityVerdict = "COMPATIBLE" | "COMPATIBLE_WITH_WARNING" | "INCOMPATIBLE";

export interface ComparableObservation {
  metricCode: string;
  unitCode: string;
  accountingFrameworkCode: string | null;
  consolidationStatus: string;
  periodType: string;
}

export interface ComparabilityResult {
  verdict: ComparabilityVerdict;
  reasons: string[];
}

export function checkComparability(a: ComparableObservation, b: ComparableObservation): ComparabilityResult {
  const reasons: string[] = [];
  let verdict: ComparabilityVerdict = "COMPATIBLE";

  if (a.metricCode !== b.metricCode) {
    reasons.push(`Verschillende metrics ("${a.metricCode}" vs "${b.metricCode}").`);
    verdict = "INCOMPATIBLE";
  }

  if (a.unitCode !== b.unitCode) {
    reasons.push(`Verschillende eenheden ("${a.unitCode}" vs "${b.unitCode}").`);
    verdict = "INCOMPATIBLE";
  }

  if (a.periodType !== b.periodType) {
    reasons.push(`Verschillende periodetypes ("${a.periodType}" vs "${b.periodType}").`);
    verdict = "INCOMPATIBLE";
  }

  if (verdict === "INCOMPATIBLE") return { verdict, reasons };

  if (a.accountingFrameworkCode !== b.accountingFrameworkCode) {
    reasons.push(
      `Verschillende boekhoudkaders ("${a.accountingFrameworkCode ?? "onbekend"}" vs "${b.accountingFrameworkCode ?? "onbekend"}"). Cijfers kunnen niet-vergelijkbare definities gebruiken.`,
    );
    verdict = "COMPATIBLE_WITH_WARNING";
  }

  if (a.consolidationStatus !== b.consolidationStatus) {
    reasons.push(
      `Verschillende consolidatiestatus ("${a.consolidationStatus}" vs "${b.consolidationStatus}"). Optellen of rechtstreeks vergelijken kan misleidend zijn.`,
    );
    verdict = "COMPATIBLE_WITH_WARNING";
  }

  if (
    (a.consolidationStatus === "UNKNOWN" || b.consolidationStatus === "UNKNOWN") &&
    verdict === "COMPATIBLE"
  ) {
    reasons.push("Consolidatiestatus van minstens één observatie is onbekend.");
    verdict = "COMPATIBLE_WITH_WARNING";
  }

  return { verdict, reasons };
}
