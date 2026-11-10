import Decimal from "decimal.js";

/**
 * Never silently overwrite historical observations. Compares an incoming
 * value against the currently stored value and reports whether it is new,
 * unchanged, or a revision (in which case the caller must write an
 * ObservationRevision row before updating the observation).
 */
export type RevisionOutcome =
  | { kind: "NEW" }
  | { kind: "UNCHANGED" }
  | { kind: "REVISED"; previousValue: Decimal; newValue: Decimal };

export function detectRevision(
  existingValue: Decimal | null,
  incomingValue: Decimal,
): RevisionOutcome {
  if (existingValue === null) return { kind: "NEW" };
  if (existingValue.equals(incomingValue)) return { kind: "UNCHANGED" };
  return { kind: "REVISED", previousValue: existingValue, newValue: incomingValue };
}
