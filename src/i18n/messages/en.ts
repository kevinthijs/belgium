import type { Messages } from "./nl";

const en = {
  nav: {
    overzicht: "Overview",
    inkomsten: "Revenue",
    uitgaven: "Expenditure",
    overheden: "Governments",
    gemeenten: "Municipalities",
    vergelijk: "Compare",
    wereld: "World",
    tijdlijn: "Timeline",
    zoeken: "Search",
  },
  brand: {
    name: "Belgian State Accounts",
    eyebrow: "The Belgian state accounts",
  },
  hero: {
    heading: "Where does our public money come from, and where does it go?",
    subheading:
      "An overview of Belgian public revenue, expenditure, government debt and public finances, based on official data.",
  },
  debtCounter: {
    title: "Estimated Belgian government debt",
    perSecond: "per second",
    disclaimerLine1: "Estimated current value based on the latest available official figures.",
    disclaimerLine2: "Not an official real-time measurement.",
    methodologyButton: "How is this calculated?",
    unavailable: "No debt estimate available yet.",
  },
  metrics: {
    debtPerCapita: "Debt per inhabitant",
    debtToGdp: "Debt / GDP",
    lastObservation: "Last official observation",
    changeVsPreviousYear: "Change vs previous year",
    notAvailable: "Not available",
  },
  overview: {
    heading: "Belgium at a glance",
    revenue: "Revenue",
    expenditure: "Expenditure",
    balance: "Balance",
    expenditurePerCapita: "Expenditure per inhabitant",
  },
  history: {
    heading: "How did we get here?",
    debtInEuro: "Debt in €",
    debtToGdp: "Debt / GDP",
  },
  hundredEuro: {
    heading: "What happens to every €100?",
    subheading: "See where €100 of government money comes from and where it goes.",
    revenueTitle: "Where does €100 of government money come from?",
    expenditureTitle: "Where does €100 of government money go?",
    perHundred: "per €100",
    unavailable: "This visualisation requires revenue and expenditure data by category (Eurostat gov_10a_main / gov_10a_taxag / gov_10a_exp), which has not been imported yet.",
  },
  cofog: {
    heading: "Where does most of the money go?",
    subheading: "Government expenditure by function (COFOG), for the most recent year with complete data.",
    unavailable: "Requires COFOG expenditure data (Eurostat gov_10a_exp), not yet imported.",
  },
  comparison: {
    heading: "How does Belgium compare?",
    cta: "Compare more countries",
  },
  sourceTrust: {
    heading: "From figure to source",
    body: "Every figure can be traced back to its original dataset, period and methodology.",
    sourcesButton: "View data sources",
    methodologyButton: "Methodology",
    dataExplorerButton: "Data explorer",
  },
  dataUpdates: {
    heading: "Latest data",
    empty: "No recent dataset updates yet.",
  },
  emptyStates: {
    noData: "No data available for this period.",
    loadError: "This data could not be loaded.",
  },
  status: {
    BEGROTING: "Budget",
    AANGEPASTE_BEGROTING: "Adjusted budget",
    VOORLOPIG: "Provisional",
    DEFINITIEF: "Final",
    RAMING: "Estimate",
    PROGNOSE: "Forecast",
  },
  footer: {
    platform: "Platform",
    research: "Explore",
    transparency: "Transparency",
    project: "Project",
    tagline: "Independent overview of Belgian public finances, based on official data.",
  },
} as const satisfies Messages;

export default en;
