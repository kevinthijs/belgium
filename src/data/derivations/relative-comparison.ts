export interface RelativeComparison {
  difference: number;
  relativePercent: number | null;
}

/** Compare like-for-like values; a zero reference has no defined relative percentage. */
export function compareCountryValues(value: number | null, reference: number | null): RelativeComparison | null {
  if (value === null || reference === null || !Number.isFinite(value) || !Number.isFinite(reference)) return null;
  const difference = value - reference;
  return {
    difference: Math.abs(difference) < 1e-10 ? 0 : difference,
    relativePercent: reference === 0 ? null : Math.abs(difference) < 1e-10 ? 0 : difference / Math.abs(reference) * 100,
  };
}

