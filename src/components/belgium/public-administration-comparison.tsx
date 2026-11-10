import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatInteger, formatPercentage } from "@/lib/format/money";
import {
  localGovernmentCountries,
  localGovernmentRatios,
  localGovernmentReferenceDate,
  localGovernmentRelativeRatios,
  localGovernmentReviewedAt,
  localGovernmentSources,
  publicEmploymentComparison as employment,
  type LocalGovernmentCountry,
} from "@/data/reference/local-government-comparison";

const decimal = (value: number, digits = 1) => new Intl.NumberFormat("nl-BE", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const reviewedDate = new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${localGovernmentReviewedAt}T00:00:00Z`));
const rows: { label: string; note: string; value: (country: LocalGovernmentCountry) => string; highlighted?: boolean }[] = [
  { label: "Gemeenten / gewone burgemeesterposten", note: localGovernmentReferenceDate, value: (c) => formatInteger(c.municipalities) },
  { label: "Inwoners", note: localGovernmentReferenceDate, value: (c) => c.approximatePopulation ? `circa ${decimal(c.population / 1_000_000)} miljoen` : formatInteger(c.population) },
  { label: "Oppervlakte", note: "Landoppervlakte; Franse oppervlakte afgerond", value: (c) => `${c.approximateArea ? "circa " : ""}${formatInteger(c.areaKm2)} km²` },
  { label: "Burgemeesterposten per 100.000 inwoners", note: "Aantal posten ÷ inwoners × 100.000", value: (c) => decimal(localGovernmentRatios(c).per100000Residents), highlighted: true },
  { label: "Als percentage van de bevolking", note: "Aantal posten ÷ inwoners × 100", value: (c) => formatPercentage(localGovernmentRatios(c).percentOfPopulation, "nl-BE", 4) },
  { label: "Inwoners per burgemeesterpost", note: "Gemiddelde; inwoners ÷ aantal posten", value: (c) => `circa ${formatInteger(localGovernmentRatios(c).residentsPerMayor)}` },
  { label: "Burgemeesterposten per 1.000 km²", note: "Indicatief, op basis van de afgeronde oppervlakte", value: (c) => decimal(localGovernmentRatios(c).per1000Km2), highlighted: true },
];

export function PublicAdministrationComparison() {
  return (
    <section id="overheid-en-burgemeesters" aria-labelledby="overheid-en-burgemeesters-titel" className="border-y border-border bg-surface-muted">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 id="overheid-en-burgemeesters-titel" className="max-w-3xl text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">Overheid en burgemeesters: België en Frankrijk</h2>
        <p className="mt-3 max-w-2xl text-foreground-muted">Werkt één op vijf voor de overheid? En hoeveel burgemeesters zijn er als je rekening houdt met inwoners en oppervlakte?</p>

        <div id="overheidspersoneel" className="mt-10 grid gap-6 border-b border-border pb-9 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div><h3 className="text-xl font-semibold tracking-tight">Eén op vijf werkenden</h3><p className="mt-3 max-w-xl text-sm text-foreground-muted">Dat klopt ongeveer voor Frankrijk. De noemer is alle werkenden, inclusief zelfstandigen. Het gaat dus niet om één op vijf inwoners.</p></div>
          <div>
            <dl className="grid grid-cols-2 gap-4 border-b border-border pb-5">
              {[{ name: "België", percent: employment.belgiumPercent, oneIn: employment.belgiumOneIn }, { name: "Frankrijk", percent: employment.francePercent, oneIn: employment.franceOneIn }].map((country) => (
                <div key={country.name}>
                  <dt className={`text-sm font-medium ${country.name === "België" ? "text-accent" : "text-data-series-2"}`}>{country.name} · {employment.year}</dt>
                  <dd className="mt-2 text-3xl font-semibold tabular-nums sm:text-4xl">{formatPercentage(country.percent, "nl-BE", 2)}</dd>
                  <dd className="mt-2 text-sm text-foreground-muted">1 op {decimal(country.oneIn)} werkenden</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 max-w-2xl text-sm text-foreground-muted">Het Franse aandeel ligt <strong className="font-semibold text-foreground">{decimal(employment.percentagePointGap, 2)} procentpunt hoger</strong>. Relatief is dat circa {decimal(employment.relativeGapPercent, 0)}% hoger dan het Belgische aandeel.</p>
            <p className="mt-3 max-w-2xl text-sm text-foreground-muted">De volledige overheid (sector S13) telt verschillende bestuursniveaus en overheidsinstellingen, met statutair en contractueel personeel. Private of gesubsidieerde onderwijs- en zorginstellingen vallen niet automatisch onder de overheid. Verschillen in organisatie beïnvloeden de vergelijking.</p>
            <a href={employment.source.url} className="mt-3 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">{employment.source.label} · cijfers 2023</a>
          </div>
        </div>

        <div id="burgemeesters" className="pt-9">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
            <h3 className="text-xl font-semibold tracking-tight">Burgemeesters in verhouding</h3>
            <p className="max-w-2xl text-sm text-foreground-muted">We tellen één gewone burgemeesterpost per gemeente. Dit is geen telling van de personen die op een bepaalde dag in functie zijn. Deelgemeente-, gedelegeerde en arrondissementsburgemeesters tellen niet mee.</p>
          </div>
          <div role="region" aria-label="Burgemeesters, inwoners en oppervlakte vergelijken" className="mt-7 overflow-hidden rounded-lg border border-border bg-surface">
            <table role="table" className="block w-full table-fixed border-collapse text-sm sm:table">
              <caption className="block border-b border-border px-4 py-4 text-left text-sm text-foreground-muted sm:table-caption sm:px-6">Peildatum gemeenten en bevolking: {localGovernmentReferenceDate}. Franse bevolkingsraming voorlopig. Oppervlakte als geografische context.</caption>
              <thead role="rowgroup" className="block border-b border-border sm:table-header-group">
                <tr role="row" className="grid grid-cols-2 sm:table-row">
                  <th role="columnheader" scope="col" className="hidden w-1/2 px-6 py-4 text-left font-medium sm:table-cell">Vergelijking</th>
                  {localGovernmentCountries.map((c) => <th key={c.code} scope="col" className={`px-4 py-4 text-left font-semibold sm:w-1/4 sm:px-6 sm:text-right ${c.code === "BE" ? "text-accent" : "text-data-series-2"}`}>{c.name}</th>)}
                </tr>
              </thead>
              <tbody role="rowgroup" className="block divide-y divide-border sm:table-row-group">
                {rows.map((row) => (
                  <tr role="row" key={row.label} className={`grid grid-cols-2 sm:table-row ${row.highlighted ? "bg-surface-muted" : ""}`}>
                    <th role="rowheader" scope="row" className="col-span-2 px-4 pb-1 pt-4 text-left font-medium sm:px-6 sm:py-5">{row.label}<span className="mt-1 block text-xs font-normal text-foreground-muted">{row.note}</span></th>
                    {localGovernmentCountries.map((c) => <td role="cell" key={c.code} className={`break-words px-4 pb-4 pt-2 text-left align-top tabular-nums sm:px-6 sm:py-5 sm:text-right ${row.highlighted ? "text-xl font-semibold" : "font-medium"}`}><span className="mb-1 block text-xs font-normal text-foreground-muted sm:hidden">{c.name}</span>{row.value(c)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-3xl text-base text-foreground-muted">Frankrijk telt ongeveer <strong className="font-semibold text-foreground">{decimal(localGovernmentRelativeRatios.perResident)} keer zoveel burgemeesterposten per inwoner</strong> en <strong className="font-semibold text-foreground">{decimal(localGovernmentRelativeRatios.perArea, 0)} keer zoveel per km²</strong>. Franse gemeenten zijn gemiddeld veel kleiner.</p>
          <p className="mt-3 max-w-3xl text-sm text-foreground-muted">Dit vergelijkt de gemeentelijke indeling. Voor een vergelijking van de bestuurskosten zijn ook vergoedingen, personeel, bevoegdheden en samenwerkingsverbanden tussen gemeenten nodig. Personeelsaandelen en aantallen besturen vertellen op zichzelf niet hoeveel kwaliteit publieke diensten leveren.</p>
          <details className="mt-6 border-t border-border pt-3 text-sm">
            <summary className="min-h-11 cursor-pointer py-3 font-medium">Afbakening, berekeningen en bronnen</summary>
            <div className="mt-3 max-w-3xl space-y-4 text-foreground-muted">
              <p>Frankrijk omvat hier Europees Frankrijk, inclusief Corsica, en de vijf overzeese departementen. Andere overzeese gebieden tellen niet mee. De Franse landoppervlakte is indicatief afgerond op circa 633.000 km². Oppervlaktebronnen gebruiken verschillende meetmethoden; de verhouding per km² is daarom indicatief.</p>
              <p>De Franse bevolking is de Insee-raming uit januari 2025 van circa 68,606 miljoen inwoners. Nieuwere ramingen kunnen afwijken. De personeelvergelijking gebruikt afzonderlijk 2023, het gemeenschappelijke jaar in het bestaande OESO-referentieoverzicht.</p>
              <p>De verhoudingen zijn eigen berekeningen op basis van de vermelde aantallen. Voorbeeld: 565 ÷ 11.825.551 × 100.000 = circa 4,8 burgemeesterposten per 100.000 inwoners. Een verschil in procentpunten is een aftrekking van twee percentages; een relatief verschil deelt dat verschil door het Belgische aandeel.</p>
              <ul className="list-disc space-y-2 pl-5">{localGovernmentSources.map((source) => <li key={source.url}><a href={source.url} className="inline-block py-1 text-accent underline underline-offset-4">{source.label}</a></li>)}</ul>
            </div>
          </details>
          <p className="mt-4 max-w-2xl text-xs text-foreground-subtle">Bronnen gecontroleerd op {reviewedDate}. Handmatig bijgewerkt referentieoverzicht; geen live telling van burgemeesters.</p>
        </div>
      </div>
    </section>
  );
}

export function PublicAdministrationSummary() {
  return (
    <section aria-labelledby="bestuur-samenvatting" className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <h2 id="bestuur-samenvatting" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">Hoe groot is de overheid?</h2>
        <div className="max-w-2xl space-y-4 text-foreground-muted">
          <p><strong className="font-semibold text-foreground">Eén op vijf werkenden in Frankrijk</strong> werkt voor de overheid: {formatPercentage(employment.francePercent, "nl-BE", 2)} tegenover {formatPercentage(employment.belgiumPercent, "nl-BE", 2)} in België (OESO, {employment.year}). Het gaat om werkenden, niet om alle inwoners.</p>
          <p>Frankrijk telt {formatInteger(localGovernmentCountries[1].municipalities)} gemeenten, België {formatInteger(localGovernmentCountries[0].municipalities)} (1 januari 2025). Met één gewone burgemeesterpost per gemeente zijn dat circa <strong className="font-semibold text-foreground">{decimal(localGovernmentRelativeRatios.perResident)} keer zoveel posten per inwoner</strong> in Frankrijk.</p>
          <p>Vergelijk ook de bestuurskosten per inwoner, onderwijs- en gezondheidsuitkomsten en demografie met Frankrijk, Nederland, Duitsland en Spanje. De kostenevolutie is beschikbaar met en zonder inflatiecorrectie.</p>
          <Link href="/vergelijk#bestuurskosten" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent underline underline-offset-4">Bestuurskosten en publieke resultaten vergelijken <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>
          <Link href="/vergelijk#overheid-en-burgemeesters" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent underline underline-offset-4">Vergelijk overheidspersoneel en burgemeesters <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>
        </div>
      </div>
    </section>
  );
}
