import type { Messages } from "./nl";

const de = {
  nav: {
    overzicht: "Übersicht",
    inkomsten: "Einnahmen",
    uitgaven: "Ausgaben",
    overheden: "Regierungsebenen",
    gemeenten: "Gemeinden",
    vergelijk: "Vergleichen",
    wereld: "Welt",
    tijdlijn: "Zeitleiste",
    zoeken: "Suchen",
  },
  brand: {
    name: "Belgische Staatsrechnung",
    eyebrow: "Die belgische Staatsrechnung",
  },
  hero: {
    heading: "Woher kommt unser öffentliches Geld und wohin fließt es?",
    subheading:
      "Ein Überblick über belgische Einnahmen, Ausgaben, Staatsschulden und öffentliche Finanzen auf Basis offizieller Daten.",
  },
  debtCounter: {
    title: "Geschätzte belgische Staatsschuld",
    perSecond: "pro Sekunde",
    disclaimerLine1: "Geschätzter aktueller Wert auf Basis der zuletzt verfügbaren offiziellen Zahlen.",
    disclaimerLine2: "Keine offizielle Echtzeitmessung.",
    methodologyButton: "Wie wird das berechnet?",
    unavailable: "Noch keine Schuldenschätzung verfügbar.",
  },
  metrics: {
    debtPerCapita: "Schulden pro Einwohner",
    debtToGdp: "Schulden / BIP",
    lastObservation: "Letzte offizielle Messung",
    changeVsPreviousYear: "Veränderung gegenüber Vorjahr",
    notAvailable: "Nicht verfügbar",
  },
  overview: {
    heading: "Belgien auf einen Blick",
    revenue: "Einnahmen",
    expenditure: "Ausgaben",
    balance: "Saldo",
    expenditurePerCapita: "Ausgaben pro Einwohner",
  },
  history: {
    heading: "Wie sind wir hierhergekommen?",
    debtInEuro: "Schulden in €",
    debtToGdp: "Schulden / BIP",
  },
  hundredEuro: {
    heading: "Was passiert mit 100 €?",
    subheading: "Woher 100 € öffentliches Geld kommen und wohin sie gehen.",
    revenueTitle: "Woher kommen 100 € öffentliches Geld?",
    expenditureTitle: "Wohin gehen 100 € öffentliches Geld?",
    perHundred: "pro 100 €",
    unavailable: "Diese Visualisierung erfordert Einnahmen- und Ausgabendaten nach Kategorie (Eurostat gov_10a_main / gov_10a_taxag / gov_10a_exp), die noch nicht importiert wurden.",
  },
  cofog: {
    heading: "Wohin fließt das meiste Geld?",
    subheading: "Staatsausgaben nach Funktion (COFOG), für das jüngste Jahr mit vollständigen Daten.",
    unavailable: "Erfordert COFOG-Ausgabendaten (Eurostat gov_10a_exp), noch nicht importiert.",
  },
  comparison: {
    heading: "Wie schneidet Belgien im Vergleich ab?",
    cta: "Mehr Länder vergleichen",
  },
  sourceTrust: {
    heading: "Von der Zahl zur Quelle",
    body: "Jede Zahl lässt sich bis zum ursprünglichen Datensatz, Zeitraum und zur Methodik zurückverfolgen.",
    sourcesButton: "Datenquellen ansehen",
    methodologyButton: "Methodik",
    dataExplorerButton: "Daten-Explorer",
  },
  dataUpdates: {
    heading: "Neue Daten",
    empty: "Noch keine aktuellen Aktualisierungen.",
  },
  emptyStates: {
    noData: "Für diesen Zeitraum sind keine Daten verfügbar.",
    loadError: "Diese Daten konnten nicht geladen werden.",
  },
  status: {
    BEGROTING: "Haushalt",
    AANGEPASTE_BEGROTING: "Angepasster Haushalt",
    VOORLOPIG: "Vorläufig",
    DEFINITIEF: "Endgültig",
    RAMING: "Schätzung",
    PROGNOSE: "Prognose",
  },
  footer: {
    platform: "Plattform",
    research: "Erkunden",
    transparency: "Transparenz",
    project: "Projekt",
    tagline: "Unabhängiger Überblick über die belgischen öffentlichen Finanzen, basierend auf offiziellen Daten.",
  },
} as const satisfies Messages;

export default de;
