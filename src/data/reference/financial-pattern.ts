import snapshot from "./financial-pattern-snapshot.json";
import outlook from "./financial-outlook-snapshot.json";
import { completeComparisonCountries, type CompleteCountryCode, type ComparisonObservation } from "./complete-country-comparison";

export const financialCountries = completeComparisonCountries;
export const financialReviewedAt = snapshot.reviewedAt;
export const financialOutlook = outlook;
export type FinancialSource = keyof typeof snapshot.sources;
export type FinancialUnit = "total" | "resident" | "gdp";
interface JsonStatSlice {
  id: string[]; size: number[];
  dimension: Record<string, { category: { index: Record<string, number> } }>;
  value: Record<string, number>; status?: Record<string, string>;
}

export function financialObservation(source: FinancialSource, filters: Record<string, string>): ComparisonObservation {
  const data = snapshot.sources[source].data as unknown as JsonStatSlice;
  let offset = 0;
  for (let position = 0; position < data.id.length; position++) {
    const dimension = data.id[position]!;
    const index = data.dimension[dimension]!.category.index;
    const code = filters[dimension] ?? (Object.keys(index).length === 1 ? Object.keys(index)[0] : undefined);
    if (code === undefined) throw new Error(`Missing dimension filter: ${source}.${dimension}`);
    if (index[code] === undefined) return { value: null, status: "m" };
    offset = offset * data.size[position]! + index[code]!;
  }
  const value = data.value[String(offset)];
  return { value: value !== undefined && Number.isFinite(value) ? value : null, status: data.status?.[String(offset)] ?? "" };
}

function derive(observations: ComparisonObservation[], calculate: (...values: number[]) => number): ComparisonObservation {
  const status = [...new Set(observations.flatMap((observation) => observation.status.split("")).filter(Boolean))].join("");
  if (observations.some((observation) => observation.value === null)) return { value: null, status };
  const value = calculate(...observations.map((observation) => observation.value!));
  return { value: Number.isFinite(value) ? value : null, status };
}

export function financialAmount(country: string, item: string, year: string, source: "main" | "tax" | "debt" = "main") {
  return derive([financialObservation(source, { geo: country, time: year, na_item: item, unit: "MIO_EUR" })], (value) => value * 1_000_000);
}

const mainYears = Object.keys(snapshot.sources.main.data.dimension.time.category.index).sort();
export const financialYears = mainYears.filter((time) => financialCountries.every((country) =>
  ["TR", "TE", "B9", "D41PAY", "P51G"].every((na_item) => financialObservation("main", { geo: country.code, time, na_item, unit: "MIO_EUR" }).value !== null)
  && financialObservation("population", { geo: country.code, time }).value !== null
  && financialObservation("gdp", { geo: country.code, time }).value !== null));
export const financialLatestYear = financialYears.at(-1)!;
export const socialYears = financialYears.filter((time) => financialCountries.every((country) => financialObservation("social", { geo: country.code, time, na_item: "TE", cofog99: "GF10", unit: "MIO_EUR" }).value !== null));
export const socialLatestYear = socialYears.at(-1)!;
export const guaranteesYear = Object.keys(snapshot.sources.guarantees.data.dimension.time.category.index).sort().reverse().find((time) => financialCountries.every((country) => financialObservation("guarantees", { geo: country.code, time, unit: "PC_GDP" }).value !== null))!;

export const financialMetrics = [
  { key: "revenue", label: "Totale inkomsten", item: "TR" },
  { key: "expenditure", label: "Totale uitgaven", item: "TE" },
  { key: "balance", label: "Begrotingssaldo", item: "B9" },
  { key: "interest", label: "Betaalde rente", item: "D41PAY" },
  { key: "investment", label: "Investeringen in vaste activa", item: "P51G" },
  { key: "primary", label: "Primair saldo", item: "" },
  { key: "debt", label: "Overheidsschuld op jaareinde", item: "GD" },
] as const;
export type FinancialMetricKey = (typeof financialMetrics)[number]["key"];

export function financialMetric(country: string, key: FinancialMetricKey, year: string): ComparisonObservation {
  const metric = financialMetrics.find((item) => item.key === key)!;
  if (key === "primary") return derive([financialAmount(country, "B9", year), financialAmount(country, "D41PAY", year)], (balance, interest) => balance + interest);
  return financialAmount(country, metric.item, year, key === "debt" ? "debt" : "main");
}

export function flowBalance(country: string, year: string) {
  return derive([financialMetric(country, "revenue", year), financialMetric(country, "expenditure", year)], (revenue, expenditure) => revenue - expenditure);
}

export function balanceReconciliation(country: string, year: string) {
  return derive([flowBalance(country, year), financialMetric(country, "balance", year)], (calculated, reported) => calculated - reported);
}

export function financialValue(observation: ComparisonObservation, country: string, year: string, unit: FinancialUnit): ComparisonObservation {
  if (unit === "total") return observation;
  const denominator = unit === "resident" ? financialObservation("population", { geo: country, time: year }) : derive([financialObservation("gdp", { geo: country, time: year })], (millions) => millions * 1_000_000);
  return derive([observation, denominator], (amount, divisor) => divisor > 0 ? amount / divisor * (unit === "gdp" ? 100 : 1) : NaN);
}

export function historicalValue(country: string, key: string, year: string, unit: FinancialUnit, real: boolean) {
  const observation = key.startsWith("tax:") ? financialAmount(country, key.slice(4), year, "tax")
    : key.startsWith("social:") ? socialAmount(country, key.slice(7), year)
    : key.startsWith("income:") ? incomeCategories(country, year).find((item) => item.key === key.slice(7))?.amount ?? { value: null, status: "m" }
    : key.startsWith("expense:") ? expenditureCategories(country, year).find((item) => item.key === key.slice(8))?.amount ?? { value: null, status: "m" }
    : financialMetrics.some((item) => item.key === key) ? financialMetric(country, key as FinancialMetricKey, year) : { value: null, status: "m" };
  const nominal = financialValue(observation, country, year, unit);
  if (!real || unit === "gdp") return nominal;
  return derive([nominal, financialObservation("inflation", { geo: country, time: financialYears[0]! }), financialObservation("inflation", { geo: country, time: year })], (amount, base, current) => current > 0 ? amount * base / current : NaN);
}

export interface FinancialCategory { key: string; label: string; definition: string; amount: ComparisonObservation }
export function incomeCategories(country: string, year: string): FinancialCategory[] {
  const main = (item: string) => financialAmount(country, item, year);
  return [
    { key: "production", label: "Belastingen op productie en invoer", definition: "D2 · bevat onder meer btw en accijnzen", amount: main("D2REC") },
    { key: "income", label: "Belastingen op inkomen en lopend vermogen", definition: "D5 · personen, bedrijven en andere lopende heffingen", amount: main("D5REC") },
    { key: "social", label: "Netto sociale bijdragen", definition: "D61 · inclusief toegerekende bijdragen; geen uitsluitend geïnde kasontvangsten", amount: main("D61REC") },
    { key: "capitalTax", label: "Kapitaalbelastingen", definition: "D91 · geen verzamelpost voor alle vastgoed- en vermogensheffingen", amount: main("D91REC") },
    { key: "sales", label: "Verkopen, eigen productie en diensten", definition: "P11 + P12 + P131 · bevat ook productie voor eigen finaal gebruik", amount: main("P11_P12_P131") },
    { key: "property", label: "Rente, dividenden en ander vermogensinkomen", definition: "D4 · ontvangen inkomen, geen verkoop van aandelen", amount: main("D4REC") },
    { key: "currentTransfers", label: "Overige ontvangen lopende overdrachten", definition: "D7 · geconsolideerd, inclusief relevante buitenlandse overdrachten", amount: main("D7REC") },
    { key: "capitalTransfers", label: "Kapitaaloverdrachten zonder kapitaalbelastingen", definition: "D9 min D91 · onder meer investeringsbijdragen", amount: derive([main("D9REC"), main("D91REC")], (all, taxes) => all - taxes) },
    { key: "subsidies", label: "Ontvangen overige productiesubsidies", definition: "D39 · subsidies die de overheid zelf ontvangt", amount: main("D39REC") },
  ];
}

export function expenditureCategories(country: string, year: string): FinancialCategory[] {
  const main = (item: string) => financialAmount(country, item, year);
  return [
    { key: "payroll", label: "Lonen en werkgeversbijdragen", definition: "D1 · overheidspersoneel in alle functies", amount: main("D1PAY") },
    { key: "purchases", label: "Aankopen voor de werking", definition: "P2 · intermediair verbruik, geen investeringen", amount: main("P2") },
    { key: "benefits", label: "Uitkeringen en aangekochte sociale verstrekkingen", definition: "D62 + D632 · breder dan uitsluitend COFOG sociale bescherming", amount: main("D62_D632PAY") },
    { key: "interest", label: "Rentelasten", definition: "D41 · betaalde rente", amount: main("D41PAY") },
    { key: "investment", label: "Investeringen in vaste activa", definition: "P51G · bruto investeringen, vóór afschrijving", amount: main("P51G") },
    { key: "otherAssets", label: "Voorraden en nettoaankopen overige niet-financiële activa", definition: "OP5ANP min P51G · kan negatief zijn bij nettoverkopen", amount: derive([main("OP5ANP"), main("P51G")], (all, fixed) => all - fixed) },
    { key: "subsidies", label: "Subsidies aan producenten", definition: "D3 · niet hetzelfde als alle sociale uitkeringen of kapitaalsteun", amount: main("D3PAY") },
    { key: "currentTransfers", label: "Overige betaalde lopende overdrachten", definition: "D7 · geconsolideerd", amount: main("D7PAY") },
    { key: "capitalTransfers", label: "Kapitaaloverdrachten", definition: "D9 · onder meer investeringsbijdragen aan andere sectoren", amount: main("D9PAY") },
    { key: "otherProperty", label: "Overige betaalde vermogensinkomsten", definition: "D4 min D41 · rente telt hier niet nogmaals mee", amount: derive([main("D4PAY"), main("D41PAY")], (all, interest) => all - interest) },
    { key: "taxPayments", label: "Belastingen die overheidsproducenten zelf betalen", definition: "D29 + D5 · uitgaven binnen de nationale-rekeningenindeling", amount: derive([main("D29PAY"), main("D5PAY")], (production, income) => production + income) },
  ];
}

/** Preserve any discrepancy explicitly; never force a category to absorb it silently. */
export function withReconciliation(categories: FinancialCategory[], total: ComparisonObservation): FinancialCategory[] {
  const remainder = derive([total, ...categories.map((category) => category.amount)], (sum, ...parts) => {
    const difference = sum - parts.reduce((amount, value) => amount + value, 0);
    return Math.abs(difference) < 0.01 ? 0 : difference;
  });
  return [...categories, { key: "reconciliation", label: "Statistische aansluiting", definition: "Totaal min de afzonderlijke bronposten; geen inhoudelijk toegewezen uitgave of ontvangst", amount: remainder }];
}

export const socialCategories = [
  { code: "GF1001", label: "Ziekte en invaliditeit" }, { code: "GF1002", label: "Ouderdom" },
  { code: "GF1003", label: "Nabestaanden" }, { code: "GF1004", label: "Gezinnen en kinderen" },
  { code: "GF1005", label: "Werkloosheid" }, { code: "GF1006", label: "Huisvesting binnen sociale bescherming" },
  { code: "GF1007", label: "Sociale uitsluiting" }, { code: "GF1008", label: "Onderzoek sociale bescherming" },
  { code: "GF1009", label: "Overige sociale bescherming" },
] as const;
export function socialAmount(country: string, code: string, year: string) {
  return derive([financialObservation("social", { geo: country, time: year, cofog99: code, na_item: "TE", unit: "MIO_EUR" })], (value) => value * 1_000_000);
}

export const detailedTaxes = [
  { code: "D211", label: "Btw", definition: "Alle btw-tarieven samen" },
  { code: "D214A", label: "Accijnzen en verbruiksbelastingen", definition: "Gecombineerde categorie; geen afzonderlijke netto-opbrengst voor brandstof, tabak of alcohol" },
  { code: "D2122C", label: "Accijnzen op invoer", definition: "Afzonderlijke ESA-post naast D214A" },
  { code: "D214C", label: "Financiële en kapitaaltransacties", definition: "Omvat meer dan vastgoedtransacties" },
  { code: "D214D", label: "Registratiebelastingen op voertuigen", definition: "Geen volledige som van alle autobelastingen" },
  { code: "D29A", label: "Grond en gebouwen bij productie", definition: "Deze vastgoedpost is geen totaal voor alle eigenaren en belastingsoorten" },
  { code: "D59A", label: "Lopende belastingen op vermogen", definition: "Kan meer omvatten dan vastgoed" },
  { code: "D91A", label: "Heffingen op vermogensoverdrachten", definition: "Onder meer erf- en schenkbelasting; geen jaarlijks vermogensbelastingtotaal" },
  { code: "D51A_C1", label: "Personeninkomen inclusief vermogenswinsten", definition: "ESA D51A_C1" },
  { code: "D51B_C2", label: "Ondernemingsinkomen inclusief vermogenswinsten", definition: "ESA D51B_C2" },
] as const;
export const nonTaxDetails = [
  { item: "P11_P12_P131", label: "Verkopen, eigen productie en diensten" },
  { item: "D41REC", label: "Ontvangen rente" }, { item: "D42REC", label: "Ontvangen dividenden en uitgedeelde winsten" },
  { item: "D45REC", label: "Grondrente en vergelijkbare ontvangsten" },
  { item: "D7REC_S212", label: "Lopende overdrachten uit EU-instellingen" },
  { item: "D9REC_S212", label: "Kapitaaloverdrachten uit EU-instellingen" },
] as const;

export const financialHistoryOptions = [
  ...financialMetrics.map((item) => ({ key: item.key, label: item.label, group: "Hoofdindicatoren" })),
  ...detailedTaxes.map((item) => ({ key: `tax:${item.code}`, label: item.label, group: "Belastingdetails" })),
  ...[{ code: "GF10", label: "Totale sociale bescherming" }, ...socialCategories].map((item) => ({ key: `social:${item.code}`, label: item.label, group: "Sociale bescherming" })),
  ...incomeCategories("BE", financialLatestYear).map((item) => ({ key: `income:${item.key}`, label: item.label, group: "Inkomsten" })),
  ...expenditureCategories("BE", financialLatestYear).map((item) => ({ key: `expense:${item.key}`, label: item.label, group: "Economische uitgaven" })),
];

export function debtBridge(country: string, year: string) {
  const start = financialAmount(country, "GD", String(Number(year) - 1), "debt");
  const end = financialAmount(country, "GD", year, "debt");
  const borrowing = derive([financialMetric(country, "balance", year)], (balance) => -balance);
  const change = derive([end, start], (current, previous) => current - previous);
  const adjustment = derive([change, borrowing], (increase, deficit) => increase - deficit);
  return { start, borrowing, adjustment, change, end };
}

export function guaranteeAmount(country: string) {
  return derive([financialObservation("guarantees", { geo: country, time: guaranteesYear, unit: "MIO_NAC" })], (value) => value * 1_000_000);
}
export function forecastValue(country: CompleteCountryCode, key: "balance" | "debt") {
  return outlook.forecast.values[country][key];
}
export function financialSource(source: FinancialSource) {
  const labels: Record<FinancialSource, string> = { main: "overheidsrekening", social: "sociale bescherming", tax: "belastingdetails", debt: "tekort en schuld", gdp: "bbp", population: "gemiddelde bevolking", inflation: "HICP", guarantees: "garanties" };
  return { label: `Eurostat · ${labels[source]} (${snapshot.sources[source].dataset})`, url: snapshot.sources[source].url, updated: snapshot.sources[source].data.updated };
}
