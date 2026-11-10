/**
 * Configuration-driven map of which public pages/sections read from each
 * dataset, keyed by `SourceDataset.code`. Deliberately static (not derived
 * from a query trace) so it stays legible and is the first thing to update
 * whenever a query function starts/stops reading a dataset. Purpose: before
 * disabling or changing a dataset, know which public pages are affected.
 */
export const DATASET_PUBLIC_USAGE: Record<string, string[]> = {
  gov_10q_ggdebt: [
    "Homepage — schuldenteller (hero)",
    "Homepage — Schuld per inwoner",
    "Homepage — Schuld / bbp",
    "Homepage — schuldgeschiedenis",
    "Homepage — internationale vergelijking",
  ],
  gov_10a_main: [
    "Homepage — België in één oogopslag (inkomsten/uitgaven/saldo)",
    "Homepage — Uitgaven per inwoner",
    "Homepage — Wat gebeurt er met €100? (totaalcompatibiliteit)",
  ],
  gov_10a_exp: [
    "Homepage — Wat gebeurt er met €100? (uitgaven)",
    "Homepage — Waar gaat het meeste geld naartoe? (COFOG)",
  ],
  gov_10a_taxag: ["Homepage — Wat gebeurt er met €100? (inkomsten)"],
  statbel_population_per_municipality: [
    "Homepage — Schuld per inwoner (bevolkingsnoemer)",
    "Homepage — Uitgaven per inwoner (bevolkingsnoemer)",
  ],
};

export function getPublicUsageForDataset(datasetCode: string): string[] {
  return DATASET_PUBLIC_USAGE[datasetCode] ?? [];
}
