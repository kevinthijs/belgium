export interface UnmappedGroup {
  datasetCode: string;
  dimension: string;
  rawValue: string;
  category: string;
  severity: string;
  /** Status of the most recently detected row in the group — a display
   * simplification, since status can technically diverge row-by-row within
   * a group (e.g. some occurrences already reviewed, later ones not). */
  latestStatus: string;
  occurrenceCount: number;
  firstDetectedAt: Date;
  lastDetectedAt: Date;
  sampleContext: unknown;
  resolvedCount: number;
}

/** Highest-occurrence groups first, so the values worth mapping next surface
 * at the top of the page. Ties keep their relative order (stable sort). */
export function sortUnmappedByOccurrence(groups: UnmappedGroup[]): UnmappedGroup[] {
  return [...groups].sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}
