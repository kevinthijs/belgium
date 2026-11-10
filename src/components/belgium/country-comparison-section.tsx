import Link from "next/link";
import {
  comparisonCountries,
  comparisonMetrics,
  comparisonReviewedAt,
  isProvisional,
} from "@/data/reference/country-comparison";
import { formatCompactCurrency, formatPercentage } from "@/lib/format/money";
import { CountryComparisonChart } from "./country-comparison-chart";

const reviewedDate = new Intl.DateTimeFormat("nl-BE", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${comparisonReviewedAt}T00:00:00Z`));

export function CountryComparisonSection() {
  return (
    <section id="landenvergelijking" aria-labelledby="landenvergelijking-titel" className="mx-auto max-w-content scroll-mt-16 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 id="landenvergelijking-titel" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        België, Frankrijk, Spanje en Nederland
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Vergelijk belastingen, overheidspersoneel en bestedingen. Binnen elk onderwerp gebruiken we hetzelfde
        jaar en dezelfde definitie voor alle vier de landen. Het beschikbare referentiejaar verschilt per onderwerp.
      </p>

      <CountryComparisonChart />

      <div role="region" aria-label="Vergelijkingstabel, horizontaal schuifbaar" tabIndex={0} className="mt-8 overflow-x-auto rounded-lg border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <caption className="px-5 py-4 text-left font-medium text-foreground">
            Alle indicatoren naast elkaar
          </caption>
          <thead className="border-y border-border bg-surface-muted">
            <tr>
              <th scope="col" className="px-5 py-3 text-left font-medium text-foreground">Indicator en jaar</th>
              {comparisonCountries.map((country) => (
                <th key={country.code} scope="col" className={`px-4 py-3 text-right font-medium ${country.code === "BE" ? "bg-accent-muted text-accent" : "text-foreground"}`}>
                  {country.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparisonMetrics.map((metric) => (
              <tr key={metric.key}>
                <th scope="row" className="px-5 py-4 text-left font-medium text-foreground">
                  {metric.label}
                  <span className="mt-1 block text-xs font-normal text-foreground-muted">
                    {metric.year} · {metric.unit}
                  </span>
                </th>
                {comparisonCountries.map((country) => (
                  <td key={country.code} className={`px-4 py-4 text-right align-top tabular-nums text-foreground ${country.code === "BE" ? "bg-accent-muted/30" : ""}`}>
                    <span className={country.code === "BE" ? "font-semibold" : undefined}>
                      {formatPercentage(country[metric.key])}
                    </span>
                    {isProvisional(country, metric.key) ? (
                      <span className="ml-1 text-xs text-foreground-muted" aria-label="voorlopig">*</span>
                    ) : null}
                    {metric.amountKey ? (
                      <span className="mt-1 block whitespace-nowrap text-xs text-foreground-muted">
                        {formatCompactCurrency(country[metric.amountKey])}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-foreground-subtle">
        * Voorlopig volgens de bron. De bedragen in euro bij onderwijs en defensie hebben hetzelfde jaar
        en dezelfde afbakening als het percentage erboven.
      </p>

      <details className="mt-6 rounded-md border border-border bg-surface p-5 text-sm sm:p-6">
        <summary className="cursor-pointer font-medium text-foreground">Definities en bronnen per onderwerp</summary>
        <dl className="mt-5 space-y-6">
          {comparisonMetrics.map((metric) => (
            <div key={metric.key}>
              <dt className="font-medium text-foreground">{metric.label} · {metric.year}</dt>
              <dd className="mt-2 max-w-2xl space-y-2 text-foreground-muted">
                <p>{metric.definition}</p>
                <p>{metric.caveat}</p>
                <a href={metric.source.url} className="inline-block text-accent underline underline-offset-2">{metric.source.label}</a>
              </dd>
            </div>
          ))}
        </dl>
      </details>

      <p className="mt-6 max-w-2xl text-sm text-foreground-muted">
        “Eén op vijf in Frankrijk” gaat over werkenden bij de overheid, niet over alle inwoners of uitsluitend
        statutaire ambtenaren. Belastingen en personeelsaantallen vertellen op zichzelf niet hoeveel kwaliteit
        een land met zijn publieke diensten levert.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-foreground-muted">
        Voor partijfinanciering en rechtstreeks betaalde NAVO-bijdragen is nog geen vergelijking met dezelfde
        afbakening voor alle vier de landen vastgesteld. De Belgische bedragen staan bij het{" "}
        <Link href="/belgie#bestedingen" className="text-accent underline underline-offset-2">bestedingenoverzicht</Link>.
      </p>
      <p className="mt-3 max-w-2xl text-xs text-foreground-subtle">
        Bronnen gecontroleerd op {reviewedDate}. Dit referentieoverzicht wordt handmatig bijgewerkt.
        Nieuwere bronherzieningen kunnen afwijken van deze momentopname.
      </p>
    </section>
  );
}
