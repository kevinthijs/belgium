import { CountryExplorer } from "./country-explorer";
import { RecentCountryComparison } from "./recent-country-comparison";
import { FinancialPattern } from "./financial-pattern";
import Link from "next/link";
import {
  completeComparisonCountries as countries, comparisonContextReviewedAt, comparisonContextYear,
  contextMetrics, contextObservation, outcomeMetrics, outcomeObservation, pisaReference, sourceLink,
  type CompleteCountryCode,
} from "@/data/reference/complete-country-comparison";
import { formatInteger, formatPercentage } from "@/lib/format/money";
import { AdministrationCostComparison, AdministrationCostTrend } from "./comparison-costs-and-trend";
import { FiveCountryTable } from "./five-country-table";

const number = (value: number) => new Intl.NumberFormat("nl-BE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const reviewedDate = new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${comparisonContextReviewedAt}T00:00:00Z`));

export function CompleteCountryComparison() {
  return (
    <>
      <FinancialPattern />
      <RecentCountryComparison />
      <CountryExplorer />
      <AdministrationCostComparison />
      <section id="publieke-resultaten" aria-labelledby="publieke-resultaten-titel" className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 id="publieke-resultaten-titel" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">Wat krijgen burgers terug?</h2>
        <p className="mt-3 max-w-2xl text-foreground-muted">Resultaten uit onderwijs en gezondheid, voor dezelfde vijf landen. Lees uitgaven en uitkomsten samen, met aandacht voor het verschil in jaar, doelgroep en omstandigheden.</p>
        <FiveCountryTable caption="Onderwijs en gezondheid · per indicator hetzelfde jaar en dezelfde definitie" rows={outcomeMetrics.map((metric) => ({
          key: metric.key, label: metric.label, description: `${metric.year} · ${metric.unit}. ${metric.direction}.`,
          values: countries.map((country) => { const value = outcomeObservation(country.code as CompleteCountryCode, metric.key); return { code: country.code, display: value.value === null ? "Niet beschikbaar" : metric.source === "pisa" ? formatInteger(value.value) : metric.key === "care" ? formatPercentage(value.value) : `${number(value.value)} jaar`, status: value.status }; }),
        }))} />
        <div className="mt-6 grid gap-5 border-y border-border py-6 lg:grid-cols-2 lg:gap-12">
          <p className="max-w-2xl text-sm text-foreground-muted">PISA test 15-jarige leerlingen. De scores zeggen niet alles over onderwijs en hebben onzekerheidsmarges. Voor Nederland waarschuwt de OESO voor afwijkingen van de steekproefnormen. Het Belgische cijfer betreft het hele land, niet uitsluitend Vlaanderen.</p>
          <p className="max-w-2xl text-sm text-foreground-muted">Gemiste medische zorg meet zelfgerapporteerde toegang, niet de kwaliteit van een behandeling. Levensverwachting hangt ook samen met inkomen, leefstijl en omgeving. Geen van deze cijfers is op zichzelf een oordeel over de efficiëntie van de overheid.</p>
        </div>
        <details className="mt-5 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium">Wat meten de resultaten? Definities en bronnen</summary><dl className="mt-3 max-w-3xl space-y-5">{outcomeMetrics.map((metric) => <div key={metric.key}><dt className="font-medium">{metric.label} · {metric.year}</dt><dd className="mt-2 text-foreground-muted"><p>{metric.description}</p><a href={metric.source === "pisa" ? pisaReference.url : sourceLink(metric.source).url} className="mt-2 inline-flex min-h-11 items-center text-accent underline underline-offset-4">{metric.source === "pisa" ? pisaReference.sourceLabel : sourceLink(metric.source).label}</a></dd></div>)}</dl></details>
        <p className="mt-4 max-w-3xl text-sm text-foreground-muted">Een vergelijking van onderwijsscores uit 2022 met uitgaven uit 2024 bewijst geen oorzakelijk verband. Ook de coronaperiode, de leerlingpopulatie en eerdere investeringen spelen mee. We maken daarom geen totaalscore of ranglijst van “beste overheid”.</p>
      </section>
      <section id="demografische-context" aria-labelledby="demografische-context-titel" className="border-y border-border bg-surface-muted">
        <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 id="demografische-context-titel" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">De context achter de cijfers</h2>
          <p className="mt-3 max-w-2xl text-foreground-muted">Dezelfde uitgave per inwoner kan bij verschillende zorgbehoeften, arbeidsmarkten en woonpatronen iets anders betekenen. Deze cijfers geven context, geen automatische verklaring of vrijstelling.</p>
          <FiveCountryTable caption={`Bevolking en arbeidsmarkt · ${comparisonContextYear}`} rows={contextMetrics.map((metric) => ({
            key: metric.key, label: metric.label, description: `${comparisonContextYear} · ${metric.unit}`,
            values: countries.map((country) => { const value = contextObservation(country.code, metric.key); return { code: country.code, display: value.value === null ? "Niet beschikbaar" : metric.key === "population" ? formatInteger(value.value) : metric.key === "density" ? number(value.value) : formatPercentage(value.value), status: value.status }; }),
          }))} />
          <details className="mt-6 border-t border-border pt-3 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium">Afbakening van bevolking, werkzaamheid en dichtheid</summary><dl className="mt-3 max-w-3xl space-y-5">{contextMetrics.map((metric) => <div key={metric.key}><dt className="font-medium">{metric.label}</dt><dd className="mt-2 text-foreground-muted"><p>{metric.description}</p><a href={sourceLink(metric.source).url} className="mt-2 inline-flex min-h-11 items-center text-accent underline underline-offset-4">{sourceLink(metric.source).label}</a></dd></div>)}</dl></details>
          <p className="mt-5 max-w-3xl text-sm text-foreground-muted">De kosten gebruiken voor elk land de gemiddelde bevolking van hetzelfde jaar uit deze Eurostat-momentopname. Die kan door bronherzieningen, het tijdstip en de bevolkingsdefinitie afwijken van de oudere nationale bevolkingscijfers bij de burgemeestervergelijking. Binnen elke vergelijking blijft de gekozen noemer gelijk.</p>
          <p className="mt-3 max-w-3xl text-sm text-foreground-muted">Waar Eurostat een afwijkende definitie of een breuk markeert, staat dat bij het cijfer. De werkzaamheid hier betreft alle sectoren; het is niet hetzelfde als het aandeel werkenden bij de overheid.</p>
        </div>
      </section>
      <AdministrationCostTrend />
      <div className="mx-auto max-w-content border-t border-border px-4 py-6 sm:px-6 lg:px-8"><p className="max-w-3xl text-xs text-foreground-subtle">Bronnen gecontroleerd op {reviewedDate}. Dit referentieoverzicht bewaart de officiële bronreacties en wordt handmatig bijgewerkt. De nieuwe vijflandenvergelijking gebruikt een eigen momentopname; de belasting- en burgemeestervergelijkingen hieronder vermelden hun eigen bronjaar en afbakening.</p><Link href="/vergelijk#landenvergelijking" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4">Ook belastingen, begrotingssaldo en andere bestedingen vergelijken →</Link></div>
    </>
  );
}
