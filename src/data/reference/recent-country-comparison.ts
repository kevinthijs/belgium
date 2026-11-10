import Decimal from "decimal.js";
import snapshot from "./recent-statistics-snapshot.json";
import { completeComparisonCountries, type ComparisonObservation, type CompleteCountryCode } from "./complete-country-comparison";

export const recentCountries = completeComparisonCountries;
export const recentReviewedAt = snapshot.reviewedAt;
export const recentPolicyReviewedAt = "2026-11-10";
type RecentSource = keyof typeof snapshot.sources;
interface JsonStatSlice {
  id: string[];
  size: number[];
  dimension: Record<string, { category: { index: Record<string, number> } }>;
  value: Record<string, number>;
  status?: Record<string, string>;
}

export function recentObservation(source: RecentSource, filters: Record<string, string>): ComparisonObservation {
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

function latestCommonPeriod(source: RecentSource, units: string[]) {
  const periods = Object.keys(snapshot.sources[source].data.dimension.time.category.index).sort().reverse();
  const period = periods.find((time) => recentCountries.every((country) => units.every((unit) => recentObservation(source, { geo: country.code, time, unit }).value !== null)));
  if (!period) throw new Error(`No common period for ${source}`);
  return period;
}

export const vatYear = latestCommonPeriod("vat", ["MIO_EUR", "PC_GDP"]);
export const transportYear = latestCommonPeriod("transport", ["MIO_EUR", "PC_GDP"]);
export const unemploymentPeriod = latestCommonPeriod("unemployment", ["PC_ACT"]);
export const unemploymentLabel = new Intl.DateTimeFormat("nl-BE", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${unemploymentPeriod}-01T00:00:00Z`));
export const recentSourceLinks = {
  vat: { label: "Eurostat · btw-opbrengsten (D211)", url: snapshot.sources.vat.url },
  unemployment: { label: "Eurostat · werkloosheid (ILO, seizoengecorrigeerd)", url: snapshot.sources.unemployment.url },
  transport: { label: "Eurostat · transportbelastingen (TRA)", url: snapshot.sources.transport.url },
  population: { label: "Eurostat · gemiddelde bevolking", url: snapshot.sources.population.url },
  rates: { label: "Europese Unie · btw-tarieven", url: "https://europa.eu/youreurope/business/finance-and-tax/vat/vat-rules-rates/index_en.htm" },
  nato: { label: "NAVO · budgetten en verdeelsleutel 2026–2027", url: "https://www.nato.int/en/what-we-do/introduction-to-nato/funding-nato" },
  transportDefinition: { label: "Eurostat · definitie transportbelastingen", url: "https://ec.europa.eu/eurostat/cache/metadata/en/env_ac_tax_esms.htm" },
  belgianVat: { label: "FOD Financiën · tarieven en aangifteroosters", url: "https://finances.belgium.be/fr/node/12036" },
} as const;

export function recentTaxObservation(country: string, source: "vat" | "transport", unit: "total" | "resident" | "gdp"): ComparisonObservation {
  const year = source === "vat" ? vatYear : transportYear;
  const observation = recentObservation(source, { geo: country, time: year, unit: unit === "gdp" ? "PC_GDP" : "MIO_EUR" });
  if (unit === "gdp" || observation.value === null) return observation;
  if (unit === "total") return { ...observation, value: observation.value * 1_000_000 };
  const population = recentObservation("population", { geo: country, time: year });
  const status = [...new Set((observation.status + population.status).split(""))].join("");
  return { value: population.value !== null && population.value > 0 ? observation.value * 1_000_000 / population.value : null, status };
}

// Main national rates, checked 10 November 2026. Territorial and product exceptions apply.
export const vatRates: Record<CompleteCountryCode, { standard: number; reduced: number[] }> = {
  BE: { standard: 21, reduced: [6, 12] },
  FR: { standard: 20, reduced: [2.1, 5.5, 10] },
  NL: { standard: 21, reduced: [9] },
  DE: { standard: 19, reduced: [7] },
  ES: { standard: 21, reduced: [4, 10] },
};

export function vatBreakdown(amount: number, rate: number, includesVat: boolean) {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || rate < 0) return null;
  const factor = new Decimal(rate).div(100).plus(1);
  const net = includesVat ? new Decimal(amount).div(factor) : new Decimal(amount);
  return { net: net.toNumber(), vat: net.mul(rate).div(100).toNumber(), gross: net.mul(factor).toNumber() };
}

export const natoBudget2026 = {
  civilEUR: 528_200_000,
  militaryEUR: 2_420_000_000,
  investmentCeilingEUR: 2_200_000_000,
  shareValidFrom: "2026-01-01",
  shareValidUntil: "2027-12-31",
};
export const natoShares: Record<CompleteCountryCode, number> = { BE: 2.0716, FR: 10.1023, NL: 3.5014, DE: 14.9039, ES: 5.7782 };
export function natoIndicative(country: CompleteCountryCode) {
  const share = new Decimal(natoShares[country]).div(100);
  const civil = new Decimal(natoBudget2026.civilEUR).mul(share);
  const military = new Decimal(natoBudget2026.militaryEUR).mul(share);
  const investment = new Decimal(natoBudget2026.investmentCeilingEUR).mul(share);
  return { civil: civil.toNumber(), military: military.toNumber(), investment: investment.toNumber(), total: civil.plus(military).plus(investment).toNumber() };
}

export const carTaxRules: Record<CompleteCountryCode, { registration: string; annual: string; sources: { label: string; url: string }[] }> = {
  BE: {
    registration: "21% btw bij een gewone nieuwe auto, plus BIV/TMC. De gewesten hanteren verschillende regels; onder meer vermogen, CO₂, brandstof, leeftijd en gewicht kunnen meetellen.",
    annual: "Jaarlijkse verkeersbelasting volgens het gewest en het voertuig. Ook de datum van inschrijving en vrijstellingen kunnen het bedrag veranderen.",
    sources: [
      { label: "Vlaanderen · verkeersbelastingen en simulator", url: "https://www.vlaanderen.be/belastingen-en-begroting/vlaamse-belastingen/verkeersbelastingen" },
      { label: "Wallonië · geldende tarieven", url: "https://finances.wallonie.be/home/fiscalite/fiscalite-des-vehicules/tableaux-des-baremes.html" },
      { label: "Brussel · verkeersbelastingen", url: "https://be.brussels/fr/impots-financement/impots-et-taxes/taxes-de-circulation-et-autres-taxes-liees-la-mobilite/taxes-de-circulation" },
    ],
  },
  FR: {
    registration: "20% btw bij een gewone nieuwe auto, registratieheffingen en eventueel een CO₂- en gewichtsmalus bij eerste inschrijving in Frankrijk. Het voertuig en de regio bepalen de uitkomst.",
    annual: "Voor zakelijk gebruikte voertuigen bestaan jaarlijkse CO₂- en luchtverontreinigingsheffingen. Die zijn geen algemene rekening voor iedere particuliere autobezitter.",
    sources: [
      { label: "Frankrijk · malus automobile 2026", url: "https://www.economie.gouv.fr/particuliers/voyager-et-se-deplacer/malus-automobile-quelles-taxes-devez-vous-payer-sur-votre-vehicule" },
      { label: "Frankrijk · jaarlijkse heffingen zakelijk gebruik", url: "https://www.impots.gouv.fr/professionnel/questions/comment-declarer-et-payer-ma-taxe-sur-les-vehicules-de-societes-tvs" },
    ],
  },
  NL: {
    registration: "21% btw bij een gewone nieuwe auto, plus eenmalige bpm. Voor personenauto’s hangt de bpm onder meer af van de CO₂-uitstoot; voor diesel kan een toeslag gelden.",
    annual: "Motorrijtuigenbelasting (mrb), onder meer afhankelijk van gewicht, brandstof en provincie. Gebruik de actuele rekenhulp; regels en kortingen verschillen per aandrijving en datum.",
    sources: [
      { label: "Nederland · bpm-tarieven 2026", url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/bpm/content/personenauto-bpm-tarief-berekenen" },
      { label: "Nederland · mrb-rekenhulp", url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/themaoverstijgend/rekenhulpen/bereken_uw_motorrijtuigenbelasting" },
    ],
  },
  DE: {
    registration: "19% btw bij een gewone nieuwe auto en registratiekosten. Het btw-tarief alleen geeft geen volledig beeld van de gebruikskosten.",
    annual: "Kfz-Steuer: voor veel recente personenauto’s een combinatie van cilinderinhoud, brandstof en CO₂. De eerste inschrijvingsdatum en eventuele vrijstelling zijn van belang.",
    sources: [{ label: "Duitsland · officiële Kfz-Steuer-rekenhulp", url: "https://www.bundesfinanzministerium.de/Web/DE/Service/Apps_Rechner/KfzRechner/embed/kfzsteuerrechner.html" }],
  },
  ES: {
    registration: "21% btw op het Spaanse vasteland en de Balearen, plus eventueel registratiebelasting (IEDMT). De basistarieven zijn 0%, 4,75%, 9,75% en 14,75%; CO₂ en regionale regels bepalen welk tarief geldt.",
    annual: "Gemeentelijke IVTM, afhankelijk van onder meer fiscale paardenkracht en lokale tarieven. Bijzondere territoriale stelsels, zoals op de Canarische Eilanden, wijken af.",
    sources: [
      { label: "Spanje · basistarieven registratiebelasting", url: "https://sede.agenciatributaria.gob.es/Sede/vehiculos-embarcaciones/primera-matriculacion-medios-transporte/son-tipos-impuesto-aplicar-caso/tipos-impositivos.html" },
      { label: "Spanje · registratie- en gemeentelijke verkeersbelasting", url: "https://sede.agenciatributaria.gob.es/Sede/eu_es/vehiculos-embarcaciones/importar-vehiculo/requisitos-exigibles-despues-aduana/informacion-calculo-pagar-matriculacion-vehiculo-otras.html" },
    ],
  },
};
