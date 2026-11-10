import type { Messages } from "./nl";

const fr = {
  nav: {
    overzicht: "Aperçu",
    inkomsten: "Recettes",
    uitgaven: "Dépenses",
    overheden: "Administrations",
    gemeenten: "Communes",
    vergelijk: "Comparer",
    wereld: "Monde",
    tijdlijn: "Chronologie",
    zoeken: "Rechercher",
  },
  brand: {
    name: "Comptes publics belges",
    eyebrow: "Les comptes publics belges",
  },
  hero: {
    heading: "D'où vient l'argent public et où va-t-il ?",
    subheading:
      "Un aperçu des recettes, dépenses, de la dette publique et des finances publiques belges, basé sur des données officielles.",
  },
  debtCounter: {
    title: "Dette publique belge estimée",
    perSecond: "par seconde",
    disclaimerLine1: "Valeur actuelle estimée sur la base des derniers chiffres officiels disponibles.",
    disclaimerLine2: "Ce n'est pas une mesure officielle en temps réel.",
    methodologyButton: "Comment ce chiffre est-il calculé ?",
    unavailable: "Aucune estimation de la dette n'est encore disponible.",
  },
  metrics: {
    debtPerCapita: "Dette par habitant",
    debtToGdp: "Dette / PIB",
    lastObservation: "Dernière mesure officielle",
    changeVsPreviousYear: "Évolution par rapport à l'année précédente",
    notAvailable: "Non disponible",
  },
  overview: {
    heading: "La Belgique en un coup d'œil",
    revenue: "Recettes",
    expenditure: "Dépenses",
    balance: "Solde",
    expenditurePerCapita: "Dépenses par habitant",
  },
  history: {
    heading: "Comment en sommes-nous arrivés là ?",
    debtInEuro: "Dette en €",
    debtToGdp: "Dette / PIB",
  },
  hundredEuro: {
    heading: "Que devient chaque tranche de 100 € ?",
    subheading: "D'où viennent et où vont les 100 € d'argent public.",
    revenueTitle: "D'où viennent les 100 € d'argent public ?",
    expenditureTitle: "Où vont les 100 € d'argent public ?",
    perHundred: "par 100 €",
    unavailable: "Cette visualisation nécessite des données de recettes et de dépenses par catégorie (Eurostat gov_10a_main / gov_10a_taxag / gov_10a_exp), pas encore importées.",
  },
  cofog: {
    heading: "Où va la majeure partie de l'argent ?",
    subheading: "Dépenses publiques par fonction (COFOG), pour l'année la plus récente disposant de données complètes.",
    unavailable: "Nécessite des données de dépenses COFOG (Eurostat gov_10a_exp), pas encore importées.",
  },
  comparison: {
    heading: "Comment se compare la Belgique ?",
    cta: "Comparer plus de pays",
  },
  sourceTrust: {
    heading: "Du chiffre à la source",
    body: "Chaque chiffre peut être retracé jusqu'à son jeu de données, sa période et sa méthodologie d'origine.",
    sourcesButton: "Voir les sources de données",
    methodologyButton: "Méthodologie",
    dataExplorerButton: "Explorateur de données",
  },
  dataUpdates: {
    heading: "Nouvelles données",
    empty: "Pas encore de mise à jour récente.",
  },
  emptyStates: {
    noData: "Aucune donnée disponible pour cette période.",
    loadError: "Ces données n'ont pas pu être chargées.",
  },
  status: {
    BEGROTING: "Budget",
    AANGEPASTE_BEGROTING: "Budget ajusté",
    VOORLOPIG: "Provisoire",
    DEFINITIEF: "Définitif",
    RAMING: "Estimation",
    PROGNOSE: "Prévision",
  },
  footer: {
    platform: "Plateforme",
    research: "Explorer",
    transparency: "Transparence",
    project: "Projet",
    tagline: "Aperçu indépendant des finances publiques belges, basé sur des données officielles.",
  },
} as const satisfies Messages;

export default fr;
