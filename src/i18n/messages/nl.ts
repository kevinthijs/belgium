/**
 * Dutch (initial / complete) UI dictionary. All homepage copy must be
 * sourced from here — never hardcoded inline in components — so fr/de/en
 * can be added without touching component code.
 */
const nl = {
  nav: {
    overzicht: "Overzicht",
    inkomsten: "Inkomsten",
    uitgaven: "Uitgaven",
    overheden: "Overheden",
    gemeenten: "Gemeenten",
    vergelijk: "Vergelijk",
    wereld: "Wereld",
    tijdlijn: "Tijdlijn",
    zoeken: "Zoeken",
  },
  brand: {
    name: "Belgische Staatsrekening",
    eyebrow: "De Belgische staatsrekening",
  },
  hero: {
    heading: "Waar komt ons overheidsgeld vandaan en waar gaat het naartoe?",
    subheading:
      "Een overzicht van Belgische inkomsten, uitgaven, overheidsschuld en publieke financiën, gebaseerd op officiële gegevens.",
  },
  debtCounter: {
    title: "Geschatte actuele overheidsschuld",
    perSecond: "per seconde",
    disclaimerLine1: "Geschatte actuele waarde op basis van de laatst beschikbare officiële gegevens.",
    disclaimerLine2: "Geen realtime officiële meting.",
    methodologyButton: "Hoe wordt dit berekend?",
    unavailable: "Er is nog geen schuldraming beschikbaar.",
  },
  metrics: {
    debtPerCapita: "Schuld per inwoner",
    debtToGdp: "Schuld / bbp",
    lastObservation: "Laatste officiële meting",
    changeVsPreviousYear: "Verandering t.o.v. vorig jaar",
    notAvailable: "Niet beschikbaar",
  },
  overview: {
    heading: "België in één oogopslag",
    revenue: "Inkomsten",
    expenditure: "Uitgaven",
    balance: "Saldo",
    expenditurePerCapita: "Uitgaven per inwoner",
  },
  history: {
    heading: "Hoe zijn we hier gekomen?",
    debtInEuro: "Schuld in €",
    debtToGdp: "Schuld / bbp",
  },
  hundredEuro: {
    heading: "Wat gebeurt er met €100?",
    subheading: "Bekijk waar elke €100 overheidsgeld vandaan komt en waar die naartoe gaat.",
    revenueTitle: "Waar komt €100 overheidsgeld vandaan?",
    expenditureTitle: "Waar gaat €100 overheidsgeld naartoe?",
    perHundred: "per € 100",
    unavailable: "Deze visualisatie vereist inkomsten- en uitgavendata per categorie (Eurostat gov_10a_main / gov_10a_taxag / gov_10a_exp), die nog niet is geïmporteerd.",
  },
  cofog: {
    heading: "Waar gaat het meeste geld naartoe?",
    subheading: "Overheidsuitgaven naar functie (COFOG), voor het meest recente jaar met volledige data.",
    unavailable: "Vereist COFOG-uitgavendata (Eurostat gov_10a_exp), nog niet geïmporteerd.",
  },
  comparison: {
    heading: "Hoe vergelijkt België?",
    cta: "Vergelijk meer landen",
  },
  sourceTrust: {
    heading: "Van cijfer tot bron",
    body: "Elk cijfer kan worden teruggeleid naar de oorspronkelijke dataset, periode en methodologie.",
    sourcesButton: "Bekijk databronnen",
    methodologyButton: "Methodologie",
    dataExplorerButton: "Data explorer",
  },
  dataUpdates: {
    heading: "Nieuwe gegevens",
    empty: "Nog geen recente dataset-updates.",
  },
  emptyStates: {
    noData: "Geen gegevens beschikbaar voor deze periode.",
    loadError: "Deze gegevens konden niet worden geladen.",
  },
  status: {
    BEGROTING: "Begroting",
    AANGEPASTE_BEGROTING: "Aangepaste begroting",
    VOORLOPIG: "Voorlopig",
    DEFINITIEF: "Definitief",
    RAMING: "Raming",
    PROGNOSE: "Prognose",
  },
  footer: {
    platform: "Platform",
    research: "Onderzoeken",
    transparency: "Transparantie",
    project: "Project",
    tagline: "Onafhankelijk overzicht van Belgische overheidsfinanciën, gebaseerd op officiële gegevens.",
  },
} as const;

export default nl;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Messages = Widen<typeof nl>;
