import snapshot from "./complete-country-comparison-snapshot.json";

export const completeComparisonCountries = snapshot.countries;
export type CompleteCountryCode = "BE" | "FR" | "NL" | "DE" | "ES";
export type SourceKey = keyof typeof snapshot.sources;
export interface ComparisonObservation { value: number | null; status: string }
interface JsonStatSlice {
  id: string[];
  size: number[];
  dimension: Record<string, { category: { index: Record<string, number> | string[] } }>;
  value: Record<string, number>;
  status?: Record<string, string>;
}
export const comparisonContextYear = snapshot.referenceYear;
export const comparisonContextReviewedAt = snapshot.reviewedAt;
export const comparisonTrendYears = snapshot.trendYears;
export const pisaReference = snapshot.pisa;
export const costMetrics = [
  { key: "administration", label: "Bestuur, financiën en buitenlandse zaken", cofog: "GF0101", item: "TE", definition: "Totale uitgaven voor uitvoerende en wetgevende organen, financiële en fiscale zaken en buitenlandse zaken (COFOG 01.1). Volledige overheid, sector S13.", caveat: "Deze brede post omvat onder meer parlementen, regeringen en hun ondersteuning, belastingadministratie en diplomatie. Dit is geen afzonderlijke telling van de kost van politici, kabinetten of burgemeesters." },
  { key: "administrationPayroll", label: "Personeelskosten binnen deze bestuurspost", cofog: "GF0101", item: "D1", definition: "Beloning van werknemers binnen COFOG 01.1: lonen en werkgeversbijdragen, inclusief toegerekende sociale bijdragen (D1).", caveat: "Dit is een onderdeel van de bestuurspost hierboven. Het omvat ook administratief personeel, niet uitsluitend politieke mandatarissen. Tel dit niet bij de totale bestuurspost op." },
  { key: "governmentPayroll", label: "Personeelskosten volledige overheid", cofog: "TOTAL", item: "D1", definition: "Beloning van werknemers in de volledige overheid (D1, sector S13), over alle functies en bestuursniveaus.", caveat: "Ook personeel in bijvoorbeeld publiek onderwijs en overheidsdiensten telt mee. Publiek gefinancierde diensten met een private werkgever kunnen buiten S13 vallen. Dit is geen maatstaf voor de omvang van de politieke klasse." },
  { key: "education", label: "Overheidsuitgaven voor onderwijs", cofog: "GF09", item: "TE", definition: "Alle onderwijsuitgaven van de volledige overheid (COFOG 09, sector S13).", caveat: "Dit omvat meer dan de 15-jarige leerlingen die PISA test. Uitgaven uit 2024 en leerprestaties uit 2022 bewijzen geen oorzakelijk verband." },
  { key: "health", label: "Overheidsuitgaven voor gezondheidszorg", cofog: "GF07", item: "TE", definition: "Alle uitgaven voor gezondheidszorg van de volledige overheid (COFOG 07, sector S13).", caveat: "Dit zijn overheidsuitgaven, niet alle zorguitgaven van overheid, verzekeraars en gezinnen samen. Uitgaven en zorgbehoeften verschillen door leeftijd, gezondheid, prijzen en de organisatie van zorg." },
] as const;
export type CostMetricKey = (typeof costMetrics)[number]["key"];
export type CostUnit = "euro" | "pps" | "gdp";
export type TrendMode = "real" | "nominal";

/** Resolve every dimension explicitly; missing observations stay missing, never zero. */
export function sourceObservation(source: SourceKey, filters: Record<string, string>): ComparisonObservation {
  const data = snapshot.sources[source].data as unknown as JsonStatSlice;
  let offset = 0;
  for (let i = 0; i < data.id.length; i++) {
    const dimension = data.id[i]!;
    const indices = data.dimension[dimension]!.category.index;
    const index = Array.isArray(indices) ? Object.fromEntries(indices.map((key, position) => [key, position])) : indices;
    const code = filters[dimension] ?? (Object.keys(index).length === 1 ? Object.keys(index)[0] : undefined);
    if (code === undefined) throw new Error(`Missing dimension filter: ${source}.${dimension}`);
    if (index[code] === undefined) return { value: null, status: "m" };
    offset = offset * data.size[i]! + index[code]!;
  }
  return { value: data.value[String(offset)] ?? null, status: data.status?.[String(offset)] ?? "" };
}

function derive(values: ComparisonObservation[], calculate: (...numbers: number[]) => number): ComparisonObservation {
  const status = [...new Set(values.flatMap((value) => value.status.split("")).filter(Boolean))].join("");
  if (values.some((value) => value.value === null)) return { value: null, status };
  const result = calculate(...values.map((value) => value.value!));
  return { value: Number.isFinite(result) ? result : null, status };
}

export function costObservation(country: string, metricKey: CostMetricKey, unit: CostUnit = "euro", year = comparisonContextYear): ComparisonObservation {
  if (unit === "pps" && year !== comparisonContextYear) throw new Error("PPS comparison requires the 2024 price-parity reference year");
  const metric = costMetrics.find((item) => item.key === metricKey)!;
  const spending = sourceObservation("spending", { geo: country, time: String(year), unit: unit === "gdp" ? "PC_GDP" : "MIO_EUR", cofog99: metric.cofog, na_item: metric.item });
  if (unit === "gdp") return spending;
  const population = sourceObservation("population", { geo: country, time: String(year), indic_de: "AVG" });
  const euros = derive([spending, population], (amount, residents) => residents > 0 ? amount * 1_000_000 / residents : NaN);
  if (unit === "euro") return euros;
  const ppp = sourceObservation("ppp", { geo: country, time: String(comparisonContextYear) });
  return derive([euros, ppp], (amount, parity) => parity > 0 ? amount / parity : NaN);
}

export function costTotal(country: string, metricKey: CostMetricKey): ComparisonObservation {
  const metric = costMetrics.find((item) => item.key === metricKey)!;
  const value = sourceObservation("spending", { geo: country, time: String(comparisonContextYear), unit: "MIO_EUR", cofog99: metric.cofog, na_item: metric.item });
  return derive([value], (millions) => millions * 1_000_000);
}

export function realCostPerResident(country: string, year: number, metric: CostMetricKey = "administration"): ComparisonObservation {
  const amount = costObservation(country, metric, "euro", year);
  const baseIndex = sourceObservation("hicp", { geo: country, time: "2019" });
  const currentIndex = sourceObservation("hicp", { geo: country, time: String(year) });
  return derive([amount, baseIndex, currentIndex], (euros, base, current) => current > 0 ? euros * base / current : NaN);
}

export function trendObservation(country: string, year: number, mode: TrendMode = "real"): ComparisonObservation {
  const initial = costObservation(country, "administration", "euro", 2019);
  const current = mode === "real" ? realCostPerResident(country, year) : costObservation(country, "administration", "euro", year);
  return derive([initial, current], (base, amount) => base > 0 ? amount / base * 100 : NaN);
}

export const outcomeMetrics = [
  { key: "math", label: "Wiskunde bij 15-jarigen", year: 2022, unit: "PISA-punten", direction: "Hoger is een hogere gemiddelde testscore", description: "Afgeronde gemiddelde PISA-score. Kleine verschillen kunnen binnen de onzekerheidsmarge liggen.", source: "pisa" },
  { key: "reading", label: "Leesvaardigheid bij 15-jarigen", year: 2022, unit: "PISA-punten", direction: "Hoger is een hogere gemiddelde testscore", description: "Dezelfde PISA-ronde en dezelfde doelgroep als bij wiskunde.", source: "pisa" },
  { key: "science", label: "Wetenschappen bij 15-jarigen", year: 2022, unit: "PISA-punten", direction: "Hoger is een hogere gemiddelde testscore", description: "Afgeronde gemiddelde score voor natuurwetenschappelijke geletterdheid.", source: "pisa" },
  { key: "care", label: "Medische zorg niet kunnen krijgen", year: 2024, unit: "% van bevolking van 16 jaar en ouder", direction: "Lager betekent minder gemelde belemmeringen", description: "Zelfgerapporteerde onvervulde behoefte door kosten, afstand of wachtlijsten. Dit meet toegang, niet de kwaliteit van een behandeling.", source: "care" },
  { key: "life", label: "Levensverwachting bij geboorte", year: 2024, unit: "jaar", direction: "Hoger betekent een langere verwachte levensduur", description: "Een brede gezondheidsuitkomst die ook afhangt van leefstijl, inkomen, omgeving en andere factoren buiten de zorg.", source: "life" },
] as const;
export type OutcomeKey = (typeof outcomeMetrics)[number]["key"];
export function outcomeObservation(country: CompleteCountryCode, key: OutcomeKey): ComparisonObservation {
  if (key === "care" || key === "life") return sourceObservation(key, { geo: country, time: "2024" });
  const fields = { math: "mathematics", reading: "reading", science: "science" } as const;
  return { value: snapshot.pisa.values[country][fields[key]], status: country === "NL" ? "s" : "" };
}

export const contextMetrics = [
  { key: "population", label: "Gemiddelde bevolking", unit: "inwoners", description: "Eurostat-jaargemiddelde; dezelfde noemer als voor de uitgaven per inwoner.", source: "population" },
  { key: "age", label: "Aandeel 65-plussers", unit: "% van de bevolking", description: "Leeftijdsopbouw op 1 januari 2024; relevant voor onder meer pensioen- en zorgbehoeften.", source: "age" },
  { key: "employment", label: "Werkzaamheid bij 20–64-jarigen", unit: "% van deze leeftijdsgroep", description: "Aandeel werkenden onder inwoners van 20 tot en met 64 jaar; alle sectoren samen.", source: "employment" },
  { key: "density", label: "Bevolkingsdichtheid", unit: "inwoners per km² land", description: "Gemiddelde dichtheid; zegt op zichzelf niet hoeveel mensen in dunbevolkte gebieden wonen.", source: "density" },
] as const;
export type ContextKey = (typeof contextMetrics)[number]["key"];
export function contextObservation(country: string, key: ContextKey): ComparisonObservation {
  return sourceObservation(key, { geo: country, time: "2024", ...(key === "population" ? { indic_de: "AVG" } : {}) });
}

export function sourceLink(source: SourceKey) {
  return { label: `Eurostat · ${snapshot.sources[source].dataset}`, url: snapshot.sources[source].url, updated: snapshot.sources[source].data.updated };
}
export function observationNote(status: string): string {
  const notes: Record<string, string> = { p: "Voorlopig", e: "Raming", b: "Breuk in de reeks", d: "Afwijkende definitie volgens de bron", s: "OESO-waarschuwing over steekproefnormen", m: "Niet beschikbaar" };
  return [...new Set(status.split(""))].map((key) => notes[key] ?? `Bronmarkering ${key}`).join(" · ");
}
