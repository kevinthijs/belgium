import {
  comparisonContextYear, completeComparisonCountries, contextObservation, costMetrics, costObservation, outcomeObservation, sourceLink,
  type ComparisonObservation, type CompleteCountryCode, type CostMetricKey, type CostUnit, type SourceKey,
} from "./complete-country-comparison";
import { natoShares, recentObservation, recentSourceLinks, recentTaxObservation, transportYear, unemploymentLabel, unemploymentPeriod, vatYear } from "./recent-country-comparison";
import { financialLatestYear, financialMetric, financialSource, financialValue, socialAmount, socialLatestYear } from "./financial-pattern";

export { completeComparisonCountries as explorerCountries } from "./complete-country-comparison";
export const explorerMetrics = [
  { key: "administration", label: "Bestuur en administratie", kind: "cost", costKey: "administration", source: "spending", definition: costMetrics[0].definition },
  { key: "governmentPayroll", label: "Personeelskosten overheid", kind: "cost", costKey: "governmentPayroll", source: "spending", definition: costMetrics[2].definition },
  { key: "education", label: "Onderwijsuitgaven", kind: "cost", costKey: "education", source: "spending", definition: costMetrics[3].definition },
  { key: "health", label: "Overheidsuitgaven voor zorg", kind: "cost", costKey: "health", source: "spending", definition: costMetrics[4].definition },
  { key: "employment", label: "Werkzaamheid, 20–64 jaar", kind: "share", source: "employment", definition: "Aandeel werkenden onder alle inwoners van 20 tot en met 64 jaar, ongeacht hun werkgever." },
  { key: "age", label: "Aandeel 65-plussers", kind: "share", source: "age", definition: "Inwoners van 65 jaar en ouder als aandeel van de bevolking, op 1 januari 2024." },
  { key: "care", label: "Onvervulde medische behoefte", kind: "share", source: "care", definition: "Aandeel van de bevolking van 16 jaar en ouder dat medische zorg niet kon krijgen door kosten, afstand of wachtlijsten. Zelfgerapporteerd; dit meet toegang, niet behandelkwaliteit." },
  { key: "vatRevenue", label: "Btw-opbrengst", kind: "share", source: "vat", recentSource: "vat", period: vatYear, unitLabel: "% van bbp", definition: "Totale btw-opbrengst over alle tarieven, na verwerking van aftrek en terugbetalingen volgens de nationale rekeningen. Dit is geen btw-tarief op een aankoop." },
  { key: "unemployment", label: "Werkloosheid (recent)", kind: "share", source: "unemployment", recentSource: "unemployment", period: unemploymentLabel, unitLabel: "% van de beroepsbevolking", definition: "Seizoengecorrigeerde werkloosheid volgens de ILO-definitie: zonder werk, actief op zoek en beschikbaar. De noemer is werkenden plus werklozen, niet de hele bevolking. Dit is niet 100% min werkzaamheid." },
  { key: "transportTaxes", label: "Transportbelastingen", kind: "share", source: "transport", recentSource: "transport", period: transportYear, unitLabel: "% van bbp", definition: "Transportbelastingen, inclusief heffingen op voertuigregistratie en -gebruik en bepaalde andere vervoersheffingen. Btw en brandstofaccijnzen zijn uitgesloten. Dit is ruimer dan alleen personenauto’s." },
  { key: "natoCommon", label: "NAVO: aandeel gemeenschappelijk budget", kind: "share", source: "nato", recentSource: "nato", period: "2026 · budgetverdeelsleutel", unitLabel: "% van gemeenschappelijke NAVO-budgetten", definition: "Officiële verdeelsleutel voor de gemeenschappelijke budgetten, geldig van 1 januari 2026 tot en met 31 december 2027. Dit is geen % van nationaal bbp en geen bewijs van een betaalde jaarbijdrage. Landgrootte en nationaal inkomen beïnvloeden dit aandeel." },
  { key: "socialProtection", label: "Sociale bescherming", kind: "share", source: "financialSocial", financialSource: "social", period: socialLatestYear, unitLabel: "% van bbp", definition: "Totale overheidsuitgaven voor sociale bescherming, COFOG GF10. Detailcategorieën staan in de volledige overheidsrekening. Dit is niet hetzelfde als alle zorguitgaven." },
  { key: "interestBurden", label: "Rentelasten", kind: "share", source: "financialMain", financialSource: "main", period: financialLatestYear, unitLabel: "% van bbp", definition: "Betaalde rente D41 van de geconsolideerde overheid. Het gaat om rentelasten, niet om aflossingen van de hoofdsom." },
  { key: "publicInvestment", label: "Publieke vaste investeringen", kind: "share", source: "financialMain", financialSource: "main", period: financialLatestYear, unitLabel: "% van bbp", definition: "Bruto investeringen in vaste activa, P51G, van de overheid S13. Vóór afschrijving; geen totaal van alle publiek gefinancierde investeringen van marktbedrijven." },
] as const;
export type ExplorerMetricKey = (typeof explorerMetrics)[number]["key"];
export type ExplorerMetric = (typeof explorerMetrics)[number];
export const explorerYear = comparisonContextYear;
export function explorerPeriod(metric: ExplorerMetric) {
  return "period" in metric ? metric.period : String(explorerYear);
}

export function explorerObservation(code: CompleteCountryCode, metric: ExplorerMetricKey, unit: CostUnit = "gdp"): ComparisonObservation {
  const selected = explorerMetrics.find((item) => item.key === metric)!;
  if (selected.kind === "cost") return costObservation(code, selected.costKey as CostMetricKey, unit);
  if (selected.key === "vatRevenue") return recentTaxObservation(code, "vat", "gdp");
  if (selected.key === "transportTaxes") return recentTaxObservation(code, "transport", "gdp");
  if (selected.key === "unemployment") return recentObservation("unemployment", { geo: code, time: unemploymentPeriod });
  if (selected.key === "natoCommon") return { value: natoShares[code], status: "" };
  if (selected.key === "socialProtection") return financialValue(socialAmount(code, "GF10", socialLatestYear), code, socialLatestYear, "gdp");
  if (selected.key === "interestBurden" || selected.key === "publicInvestment") return financialValue(financialMetric(code, selected.key === "interestBurden" ? "interest" : "investment", financialLatestYear), code, financialLatestYear, "gdp");
  if (selected.key === "care") return outcomeObservation(code, "care");
  return contextObservation(code, selected.key);
}

export function explorerUnit(metric: ExplorerMetric, unit: CostUnit) {
  if ("unitLabel" in metric) return metric.unitLabel;
  if (metric.kind === "share") return metric.key === "employment" ? "% van 20–64-jarigen" : metric.key === "age" ? "% van de bevolking" : "% van inwoners van 16 jaar en ouder";
  return unit === "gdp" ? "% van bbp" : unit === "pps" ? "PPS per inwoner" : "euro per inwoner";
}

export function explorerSource(metric: ExplorerMetric) {
  if ("financialSource" in metric) return financialSource(metric.financialSource);
  if ("recentSource" in metric) return recentSourceLinks[metric.recentSource];
  return sourceLink(metric.source as SourceKey);
}

export function explorerValues(metric: ExplorerMetricKey, unit: CostUnit) {
  return completeComparisonCountries.map((country) => ({ ...country, ...explorerObservation(country.code as CompleteCountryCode, metric, unit) }));
}
