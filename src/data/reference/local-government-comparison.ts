import { comparisonCountries, comparisonMetrics } from "./country-comparison";

export const localGovernmentReviewedAt = "2026-11-09";
export const localGovernmentReferenceDate = "1 januari 2025";

export const localGovernmentCountries = [
  { code: "BE", name: "België", municipalities: 565, population: 11_825_551, areaKm2: 30_689, approximatePopulation: false, approximateArea: false },
  { code: "FR", name: "Frankrijk", municipalities: 34_875, population: 68_606_000, areaKm2: 633_000, approximatePopulation: true, approximateArea: true },
] as const;

export type LocalGovernmentCountry = (typeof localGovernmentCountries)[number];

/** Counts ordinary mayoral posts, one per municipality; not a census of incumbents. */
export function localGovernmentRatios(country: LocalGovernmentCountry) {
  return {
    per100000Residents: country.municipalities / country.population * 100_000,
    percentOfPopulation: country.municipalities / country.population * 100,
    residentsPerMayor: country.population / country.municipalities,
    per1000Km2: country.municipalities / country.areaKm2 * 1_000,
  };
}

const belgium = comparisonCountries.find((country) => country.code === "BE")!;
const france = comparisonCountries.find((country) => country.code === "FR")!;
const employmentKey = "generalGovernmentEmploymentPercent2023";
export const publicEmploymentComparison = {
  year: 2023,
  belgiumPercent: belgium[employmentKey],
  francePercent: france[employmentKey],
  belgiumOneIn: 100 / belgium[employmentKey],
  franceOneIn: 100 / france[employmentKey],
  percentagePointGap: france[employmentKey] - belgium[employmentKey],
  relativeGapPercent: (france[employmentKey] / belgium[employmentKey] - 1) * 100,
  source: comparisonMetrics.find((metric) => metric.key === employmentKey)!.source,
};

const [be, fr] = localGovernmentCountries;
export const localGovernmentRelativeRatios = {
  perResident: localGovernmentRatios(fr).per100000Residents / localGovernmentRatios(be).per100000Residents,
  perArea: localGovernmentRatios(fr).per1000Km2 / localGovernmentRatios(be).per1000Km2,
};

export const localGovernmentSources = [
  { label: "Statbel · 565 gemeenten vanaf 1 januari 2025", url: "https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie" },
  { label: "DGCL · Franse gemeenten in 2025", url: "https://www.collectivites-locales.gouv.fr/les-collectivites-locales-en-chiffres-2025" },
  { label: "Statbel · Belgische bevolking op 1 januari 2025", url: "https://statbel.fgov.be/nl/nieuws/belgie-telde-11825551-inwoners-op-1-januari-2025-0" },
  { label: "Insee · Franse bevolkingsraming op 1 januari 2025", url: "https://www.insee.fr/fr/statistiques/8327319" },
  { label: "Statbel · oppervlakte van België", url: "https://statbel.fgov.be/nl/nieuws/bastenaken-binnenkort-de-grootste-gemeente-van-belgie" },
  { label: "Franse overheid · oppervlakte volgens Insee", url: "https://www.prefectures-regions.gouv.fr/bourgogne-franche-comte/layout/set/print/Region-et-institutions/Portrait-de-la-region/Chiffres-cles/Chiffres-cles" },
];
