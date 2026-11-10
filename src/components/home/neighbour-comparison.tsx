"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { comparisonCountries, comparisonMetrics, comparisonReviewedAt } from "@/data/reference/country-comparison";
import { compareCountryValues } from "@/data/derivations/relative-comparison";
import { formatPercentage } from "@/lib/format/money";

const featuredKeys = ["taxWedgePercentLabourCost2025", "generalGovernmentEmploymentPercent2023", "governmentExpenditurePercentGDP2024"] as const;
const featuredMetrics = featuredKeys.map((key) => comparisonMetrics.find((metric) => metric.key === key)!);
const belgium = comparisonCountries.find((country) => country.code === "BE")!;
const neighbours = comparisonCountries.filter((country) => country.code !== "BE");
const reviewedDate = new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${comparisonReviewedAt}T00:00:00Z`));

export function NeighbourComparison() {
  const [countryCode, setCountryCode] = useState("FR");
  const neighbour = neighbours.find((country) => country.code === countryCode)!;

  return (
    <section id="vergelijking" aria-labelledby="buurlanden-titel" className="border-y border-border bg-surface-muted">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="buurlanden-titel" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">België naast {neighbour.name}</h2>
            <p className="mt-3 max-w-2xl text-foreground-muted">Hoe verschillen onze overheidsfinanciën? Per onderwerp hetzelfde jaar en dezelfde definitie, zodat je de cijfers naast elkaar kunt leggen.</p>
          </div>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 text-sm font-medium text-foreground-muted">Vergelijk België met</legend>
            {neighbours.map((country) => (
              <label key={country.code} className={`relative cursor-pointer rounded-sm border px-4 py-3 text-sm font-medium transition-colors ${countryCode === country.code ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-foreground-muted hover:border-foreground-muted"}`}>
                <input type="radio" name="vergelijkingsland" value={country.code} checked={countryCode === country.code} onChange={() => setCountryCode(country.code)} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <span className="peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent">{country.name}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="mt-8 divide-y divide-border border-y border-border" aria-live="polite" aria-atomic="true">
          {featuredMetrics.map((metric) => {
            const maximum = Math.max(...comparisonCountries.map((country) => country[metric.key]));
            return (
              <div key={metric.key} className="grid items-center gap-5 py-6 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
                <div>
                  <h3 className="font-semibold">{metric.label}</h3>
                  <p className="mt-1 text-sm text-foreground-muted">{metric.year} · {metric.unit}</p>
                </div>
                <dl className="space-y-4">
                  {[belgium, neighbour].map((country) => (
                    <div key={country.code} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 sm:grid-cols-[6rem_1fr_5rem] sm:gap-4">
                      <dt className={`text-sm ${country.code === "BE" ? "font-semibold text-accent" : "text-foreground-muted"}`}>{country.name}</dt>
                      <dd aria-hidden="true" className="h-2 overflow-hidden rounded-sm bg-border">
                        <div className={`comparison-bar h-full w-full rounded-sm ${country.code === "BE" ? "bg-accent" : "bg-data-series-2"}`} style={{ transform: `scaleX(${country[metric.key] / maximum})` }} />
                      </dd>
                      <dd className="text-right text-xl font-semibold tabular-nums tracking-tight">{formatPercentage(country[metric.key])}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm text-foreground-muted lg:col-start-2">{(() => { const difference = compareCountryValues(neighbour[metric.key], belgium[metric.key])!; return difference.difference === 0 ? `${neighbour.name} heeft hetzelfde aandeel als België.` : `${neighbour.name}: ${new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 2 }).format(Math.abs(difference.difference))} procentpunt ${difference.difference > 0 ? "hoger" : "lager"} dan België (${new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 1 }).format(Math.abs(difference.relativePercent!))}% relatief).`; })()}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <details className="max-w-2xl text-sm">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-foreground-muted hover:text-foreground">Wat meten deze cijfers? Bekijk definities en bronnen</summary>
            <dl className="mt-4 space-y-5">
              {featuredMetrics.map((metric) => (
                <div key={metric.key}>
                  <dt className="font-semibold">{metric.label} · {metric.year}</dt>
                  <dd className="mt-2 space-y-2 text-foreground-muted"><p>{metric.definition}</p><p>{metric.caveat}</p><a href={metric.source.url} className="inline-block py-1 text-accent underline underline-offset-4">{metric.source.label}</a></dd>
                </div>
              ))}
            </dl>
          </details>
          <Link href="/vergelijk#landenkaart" className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-data-series-2">Verken verschillen op de kaart <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        <p className="mt-5 max-w-2xl text-xs text-foreground-subtle">Bronnen: OESO en Eurostat · gecontroleerd op {reviewedDate}. Dit is een handmatig bijgewerkte momentopname. Een hoger of lager cijfer zegt op zichzelf niets over de kwaliteit van publieke diensten.</p>
      </div>
    </section>
  );
}
