import Decimal from "decimal.js";

// Reviewed snapshot, separate from automatic statistical imports.
// These amounts have overlapping scopes and must not be added together.
// Sources and update instructions: docs/SPENDING_TOPICS.md.
export const spendingReferenceYear = 2024;
export const spendingReviewedAt = "2026-10-26";

export interface SpendingTopic {
  id: string;
  label: string;
  amountEUR: string;
  status: "Voorlopig" | "Gerapporteerd" | "Indicatieve budgetraming";
  scope: string;
  caveat: string;
  sources: ReadonlyArray<{ label: string; url: string }>;
}

export const natoBudgetBasis = {
  civilBudgetEUR: "438100000",
  militaryBudgetEUR: "2030000000",
  investmentCeilingEUR: "1300000000",
  belgianSharePercent: "2.0447",
  shareValidFrom: "2024-03-07",
} as const;

const natoIndicativeBudgetEUR = new Decimal(natoBudgetBasis.civilBudgetEUR)
  .plus(natoBudgetBasis.militaryBudgetEUR)
  .plus(natoBudgetBasis.investmentCeilingEUR)
  .mul(natoBudgetBasis.belgianSharePercent)
  .div(100)
  .toFixed(2);

const eurostatSource = {
  label: "Eurostat · gov_10a_exp",
  url: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp/default/table?lang=en",
};

export const spendingTopics: readonly SpendingTopic[] = [
  {
    id: "onderwijs",
    label: "Onderwijs",
    amountEUR: "39283600000",
    status: "Voorlopig",
    scope: "Onderwijsuitgaven van de volledige Belgische overheid, inclusief hoger onderwijs en ondersteunende diensten (COFOG 09, sector S13).",
    caveat: "Dit is ruimer dan alleen het geld voor kleuter-, lagere en middelbare scholen. Eurostat markeert het bedrag als voorlopig.",
    sources: [eurostatSource],
  },
  {
    id: "partijfinanciering",
    label: "Politieke partijen",
    amountEUR: "83700000",
    status: "Gerapporteerd",
    scope: "Rechtstreekse overheidssubsidies aan Belgische politieke partijen, waaronder partijdotaties en fractietoelagen.",
    caveat: "Dit is niet de totale kost van de politiek. Onder meer de volledige werking van parlementen en kabinetten en indirecte partijinkomsten vallen buiten dit bedrag. De bron rapporteert afgerond op €0,1 miljoen.",
    sources: [
      {
        label: "De Standaard · analyse KU Leuven van de partijrekeningen",
        url: "https://www.standaard.be/politiek/partijen-kregen-er-weer-3-miljoen-bij-de-geldstroom-blijft-excessief/95611060.html",
      },
      {
        label: "Kamer · financiële verslagen boekjaar 2024",
        url: "https://www.dekamer.be/flwb/html/56/N/56K0961.html",
      },
    ],
  },
  {
    id: "navo",
    label: "NAVO: gemeenschappelijke budgetten",
    amountEUR: natoIndicativeBudgetEUR,
    status: "Indicatieve budgetraming",
    scope: "Een benadering van het Belgische aandeel in het burgerlijke en militaire NAVO-budget en het plafond voor het gezamenlijke investeringsprogramma.",
    caveat: "Berekening: (€438,1 miljoen + €2,03 miljard + €1,3 miljard) × 2,0447%. Deze verdeelsleutel geldt vanaf 7 maart 2024. Het investeringsbedrag is een plafond. Dit is geen vastgesteld bedrag van de werkelijk betaalde Belgische jaarbijdrage en omvat geen afzonderlijke vrijwillige bijdragen.",
    sources: [
      {
        label: "NAVO · budgetten 2024",
        url: "https://www.nato.int/cps/en/natohq/news_221440.htm",
      },
      {
        label: "NAVO · Belgische verdeelsleutel vanaf 7 maart 2024 (pdf)",
        url: "https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2024/7/pdf/cost-share-2024.pdf",
      },
    ],
  },
  {
    id: "defensie",
    label: "Defensie als geheel",
    amountEUR: "7946400000",
    status: "Voorlopig",
    scope: "Belgische overheidsuitgaven voor defensie volgens Eurostat (COFOG 02, sector S13).",
    caveat: "Dit bedrag wordt niet volledig aan de NAVO betaald. De NAVO-definitie van defensie-uitgaven kan afwijken van deze statistische indeling. Eurostat markeert het bedrag als voorlopig.",
    sources: [eurostatSource],
  },
];
