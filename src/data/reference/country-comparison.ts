import snapshot from "./country-comparison-snapshot.json";

export const comparisonReviewedAt = snapshot.reviewedAt;
export const comparisonCountries = snapshot.countries;
export type ComparisonCountry = (typeof comparisonCountries)[number];
export type ComparisonMetricKey =
  | "taxRevenuePercentGDP2024"
  | "taxWedgePercentLabourCost2025"
  | "generalGovernmentEmploymentPercent2023"
  | "educationPercentGDP2024"
  | "defencePercentGDP2024"
  | "governmentRevenuePercentGDP2024"
  | "governmentExpenditurePercentGDP2024"
  | "governmentBalancePercentGDP2024";

export interface ComparisonMetric {
  key: ComparisonMetricKey;
  label: string;
  year: number;
  unit: string;
  definition: string;
  caveat: string;
  source: { label: string; url: string };
  amountKey?: "educationEUR2024" | "defenceEUR2024";
}

const sources = {
  taxes: {
    label: "OESO · Revenue Statistics 2025, tabel 1.1",
    url: snapshot.definitions.taxRevenuePercentGDP2024.url,
  },
  labour: {
    label: "OESO · Taxing Wages 2026, tabel 1.1",
    url: snapshot.definitions.taxWedgePercentLabourCost2025.url,
  },
  employment: {
    label: "OESO · Government at a Glance 2025",
    url: "https://data-explorer.oecd.org/vis?df[ag]=OECD.GOV.GIP&df[id]=DSD_GOV%40DF_GOV_EMPPS_REP_2025&dq=A.BEL%2BFRA%2BESP%2BNLD.EMPG.PT_EMP.S13..&pd=2023%2C2023&vw=tb",
  },
  spending: { label: "Eurostat · gov_10a_exp", url: snapshot.definitions.spending2024.url },
  finances: { label: "Eurostat · gov_10a_main", url: snapshot.definitions.finances2024.url },
};

export const comparisonMetrics: readonly ComparisonMetric[] = [
  {
    key: "taxWedgePercentLabourCost2025",
    label: "Belastingdruk op arbeid",
    year: 2025,
    unit: "% van totale werkgeverskosten",
    definition: "Inkomstenbelasting en sociale bijdragen van werknemer en werkgever voor een alleenstaande zonder kinderen die het gemiddelde loon van zijn land verdient.",
    caveat: "Dit is geen inhoudingspercentage op het brutoloon. Gezinsvorm en loon veranderen de uitkomst; btw en andere belastingen op aankopen zitten hier niet in. Het gemiddelde loon verschilt per land.",
    source: sources.labour,
  },
  {
    key: "taxRevenuePercentGDP2024",
    label: "Belastingen en verplichte sociale bijdragen",
    year: 2024,
    unit: "% van bbp",
    definition: "Alle belastinginkomsten en verplichte sociale bijdragen volgens de OESO-definitie, tegenover de omvang van de economie.",
    caveat: "Voorlopige cijfers. Dit is geen persoonlijk belastingtarief en ook niet het totaal van alle overheidsinkomsten. De OESO-afbakening verschilt van Eurostat-reeksen die toegerekende sociale bijdragen meetellen.",
    source: sources.taxes,
  },
  {
    key: "generalGovernmentEmploymentPercent2023",
    label: "Werkenden bij de overheid",
    year: 2023,
    unit: "% van alle werkenden",
    definition: "Personeel van de volledige overheid (sector S13) als aandeel van alle werkenden, inclusief zelfstandigen in de noemer.",
    caveat: "Dit zijn niet uitsluitend statutaire ambtenaren en ook niet alle inwoners. Onderwijs en zorg worden per land anders georganiseerd: private of gesubsidieerde instellingen vallen niet automatisch onder de overheid. Een lager aandeel bewijst op zichzelf geen hogere efficiëntie.",
    source: sources.employment,
  },
  {
    key: "educationPercentGDP2024",
    label: "Onderwijsuitgaven",
    year: 2024,
    unit: "% van bbp",
    definition: "Uitgaven voor onderwijs door de volledige overheid (COFOG 09, sector S13), inclusief hoger onderwijs en ondersteunende diensten.",
    caveat: "België, Frankrijk en Spanje: voorlopig. Een bedrag in euro toont de omvang; het aandeel van het bbp houdt rekening met de grootte van de economie.",
    source: sources.spending,
    amountKey: "educationEUR2024",
  },
  {
    key: "defencePercentGDP2024",
    label: "Defensie-uitgaven",
    year: 2024,
    unit: "% van bbp",
    definition: "Uitgaven voor defensie door de volledige overheid volgens Eurostat (COFOG 02, sector S13).",
    caveat: "België, Frankrijk en Spanje: voorlopig. Dit is geen rechtstreekse NAVO-bijdrage. De NAVO-definitie van defensie-uitgaven kan afwijken van deze COFOG-indeling.",
    source: sources.spending,
    amountKey: "defenceEUR2024",
  },
  {
    key: "governmentRevenuePercentGDP2024",
    label: "Totale overheidsinkomsten",
    year: 2024,
    unit: "% van bbp",
    definition: "Alle inkomsten van de volledige overheid (Eurostat TR, sector S13), inclusief inkomsten buiten belastingen.",
    caveat: "Gebruik dit niet als belastingdruk: de afbakening is ruimer dan de OESO-belastinginkomsten.",
    source: sources.finances,
  },
  {
    key: "governmentExpenditurePercentGDP2024",
    label: "Totale overheidsuitgaven",
    year: 2024,
    unit: "% van bbp",
    definition: "Alle uitgaven van de volledige overheid (Eurostat TE, sector S13), tegenover de omvang van de economie.",
    caveat: "Dit meet de omvang van de bestedingen, niet de kwaliteit van de publieke diensten.",
    source: sources.finances,
  },
  {
    key: "governmentBalancePercentGDP2024",
    label: "Begrotingssaldo",
    year: 2024,
    unit: "% van bbp",
    definition: "Vorderingensaldo van de volledige overheid (Eurostat B9, sector S13). Een negatief cijfer betekent een tekort; een positief cijfer een overschot.",
    caveat: "Het begrotingssaldo gaat over één jaar en is niet hetzelfde als de opgebouwde overheidsschuld.",
    source: sources.finances,
  },
];

export function isProvisional(country: ComparisonCountry, key: ComparisonMetricKey): boolean {
  if (key === "taxRevenuePercentGDP2024") return true;
  if (key === "educationPercentGDP2024") return country.educationStatus2024 === "p";
  if (key === "defencePercentGDP2024") return country.defenceStatus2024 === "p";
  return false;
}
