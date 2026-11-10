import {
  comparisonContextYear, completeComparisonCountries, contextObservation, costMetrics, costObservation, outcomeObservation, sourceLink,
  type ComparisonObservation, type CompleteCountryCode, type CostMetricKey, type CostUnit, type SourceKey,
} from "./complete-country-comparison";

export { completeComparisonCountries as explorerCountries } from "./complete-country-comparison";
export const explorerMetrics = [
  { key: "administration", label: "Bestuur en administratie", kind: "cost", costKey: "administration", source: "spending", definition: costMetrics[0].definition },
  { key: "governmentPayroll", label: "Personeelskosten overheid", kind: "cost", costKey: "governmentPayroll", source: "spending", definition: costMetrics[2].definition },
  { key: "education", label: "Onderwijsuitgaven", kind: "cost", costKey: "education", source: "spending", definition: costMetrics[3].definition },
  { key: "health", label: "Overheidsuitgaven voor zorg", kind: "cost", costKey: "health", source: "spending", definition: costMetrics[4].definition },
  { key: "employment", label: "Werkzaamheid, 20–64 jaar", kind: "share", source: "employment", definition: "Aandeel werkenden onder alle inwoners van 20 tot en met 64 jaar, ongeacht hun werkgever." },
  { key: "age", label: "Aandeel 65-plussers", kind: "share", source: "age", definition: "Inwoners van 65 jaar en ouder als aandeel van de bevolking, op 1 januari 2024." },
  { key: "care", label: "Onvervulde medische behoefte", kind: "share", source: "care", definition: "Aandeel van de bevolking van 16 jaar en ouder dat medische zorg niet kon krijgen door kosten, afstand of wachtlijsten. Zelfgerapporteerd; dit meet toegang, niet behandelkwaliteit." },
] as const;
export type ExplorerMetricKey = (typeof explorerMetrics)[number]["key"];
export type ExplorerMetric = (typeof explorerMetrics)[number];
export const explorerYear = comparisonContextYear;

export function explorerObservation(code: CompleteCountryCode, metric: ExplorerMetricKey, unit: CostUnit = "gdp"): ComparisonObservation {
  const selected = explorerMetrics.find((item) => item.key === metric)!;
  if (selected.kind === "cost") return costObservation(code, selected.costKey as CostMetricKey, unit);
  if (selected.key === "care") return outcomeObservation(code, "care");
  return contextObservation(code, selected.key);
}

export function explorerUnit(metric: ExplorerMetric, unit: CostUnit) {
  if (metric.kind === "share") return metric.key === "employment" ? "% van 20–64-jarigen" : metric.key === "age" ? "% van de bevolking" : "% van inwoners van 16 jaar en ouder";
  return unit === "gdp" ? "% van bbp" : unit === "pps" ? "PPS per inwoner" : "euro per inwoner";
}

export function explorerSource(metric: ExplorerMetric) {
  return sourceLink(metric.source as SourceKey);
}

export function explorerValues(metric: ExplorerMetricKey, unit: CostUnit) {
  return completeComparisonCountries.map((country) => ({ ...country, ...explorerObservation(country.code as CompleteCountryCode, metric, unit) }));
}
