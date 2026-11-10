"use client";

import { useId, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactCurrency, formatCurrency, formatInteger, formatPercentage } from "@/lib/format/money";
import {
  completeComparisonCountries as countries, comparisonContextYear as year, comparisonTrendYears,
  costMetrics, costObservation, costTotal, observationNote, realCostPerResident, sourceLink, trendObservation,
  type ComparisonObservation, type CostMetricKey, type CostUnit, type TrendMode,
} from "@/data/reference/complete-country-comparison";
import { FiveCountryTable } from "./five-country-table";

const number = (value: number) => new Intl.NumberFormat("nl-BE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const unitChoices: { value: CostUnit; label: string }[] = [{ value: "euro", label: "Euro per inwoner" }, { value: "pps", label: "Koopkracht (PPS)" }, { value: "gdp", label: "% van bbp" }];
const display = (observation: ComparisonObservation, unit: CostUnit) => observation.value === null ? "Niet beschikbaar" : unit === "euro" ? formatCurrency(observation.value) : unit === "pps" ? `${formatInteger(observation.value)} PPS` : formatPercentage(observation.value);

export function AdministrationCostComparison() {
  const selectId = useId();
  const [metricKey, setMetricKey] = useState<CostMetricKey>("administration");
  const [unit, setUnit] = useState<CostUnit>("euro");
  const metric = costMetrics.find((item) => item.key === metricKey)!;
  const values = countries.map((country) => ({ ...country, observation: costObservation(country.code, metricKey, unit) }));
  const maximum = Math.max(1, ...values.map((country) => country.observation.value ?? 0));
  const moneySource = sourceLink("spending");
  return (
    <section id="bestuurskosten" aria-labelledby="bestuurskosten-titel" className="border-y border-border bg-surface-muted">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 id="bestuurskosten-titel" className="max-w-3xl text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">Wat kost het bestuur per inwoner?</h2>
        <p className="mt-3 max-w-2xl text-foreground-muted">België, Frankrijk, Nederland, Duitsland en Spanje. Per indicator dezelfde bron, hetzelfde jaar en de volledige overheid, zodat bestuurslagen vergelijkbaar zijn.</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div>
            <label htmlFor={selectId} className="block text-sm font-medium">Welke uitgaven wil je vergelijken?</label>
            <select id={selectId} value={metricKey} onChange={(event) => { const choice = costMetrics.find((item) => item.key === event.target.value); if (choice) setMetricKey(choice.key); }} className="mt-2 min-h-11 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              {costMetrics.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <p className="mt-5 text-sm text-foreground-muted">{metric.definition}</p>
            <p className="mt-3 text-sm font-medium text-foreground">{metric.caveat}</p>
          </div>
          <div>
            <div aria-label="Eenheid voor kostenvergelijking" className="flex flex-wrap gap-2">{unitChoices.map((choice) => <button key={choice.value} type="button" aria-pressed={unit === choice.value} onClick={() => setUnit(choice.value)} className={`min-h-11 rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${unit === choice.value ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-foreground-muted hover:border-foreground-muted"}`}>{choice.label}</button>)}</div>
            <div className="mt-6" aria-live="polite" aria-atomic="true">
              <h3 className="font-semibold">{metric.label} · {year}</h3>
              <p className="mt-1 text-sm text-foreground-muted">{unitChoices.find((choice) => choice.value === unit)!.label}{unit === "gdp" ? " · officiële Eurostat-verhouding" : " · eigen berekening"}</p>
              <dl className="mt-5 space-y-4">{values.map((country) => <div key={country.code}><div className="grid grid-cols-[6rem_1fr_auto] items-center gap-3"><dt className={`text-sm ${country.code === "BE" ? "font-semibold text-accent" : "text-foreground-muted"}`}>{country.name}</dt><dd aria-hidden="true" className="h-2 rounded-sm bg-border"><div className={`h-full rounded-sm ${country.code === "BE" ? "bg-accent" : "bg-data-series-2"}`} style={{ width: `${(country.observation.value ?? 0) / maximum * 100}%` }} /></dd><dd className="min-w-20 text-right text-lg font-semibold tabular-nums">{display(country.observation, unit)}</dd></div>{country.observation.status ? <p className="mt-1 text-right text-xs text-foreground-muted">{observationNote(country.observation.status)}</p> : null}</div>)}</dl>
            </div>
            {unit === "pps" ? <p className="mt-5 text-sm text-foreground-muted">PPS is een rekeneenheid voor koopkracht. We delen euro per inwoner door de bbp-koopkrachtpariteit van 2024. Dit is een brede prijsniveaucorrectie, geen exacte correctie voor de prijzen van bestuur of publieke diensten.</p> : <p className="mt-5 text-sm text-foreground-muted">Per inwoner gebruiken we de gemiddelde jaarbevolking van Eurostat. De procentuele bbp-cijfers komen rechtstreeks uit Eurostat.</p>}
          </div>
        </div>
        <FiveCountryTable caption={`${metric.label} · ${year}, alle eenheden naast elkaar`} rows={[
          { key: "total", label: "Totaal in euro", description: "Niet gecorrigeerd voor de grootte van het land", values: countries.map((country) => { const value = costTotal(country.code, metricKey); return { code: country.code, display: value.value === null ? "Niet beschikbaar" : formatCompactCurrency(value.value), status: value.status }; }) },
          ...unitChoices.map((choice) => ({ key: choice.value, label: choice.label, description: choice.value === "pps" ? "Benadering met bbp-koopkrachtpariteit" : choice.value === "gdp" ? "Officiële verhouding uit de bron" : "Bedrag gedeeld door gemiddelde jaarbevolking", values: countries.map((country) => { const value = costObservation(country.code, metricKey, choice.value); return { code: country.code, display: display(value, choice.value), status: value.status }; }) })),
        ]} />
        <details className="mt-6 border-t border-border pt-3 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium">Afbakening, berekening en bronnen van de kosten</summary><div className="mt-3 max-w-3xl space-y-3 text-foreground-muted"><p>De bestuurspost is COFOG 01.1, niet de ruimere functie Algemene overheidsdiensten (01), die ook onder meer schuldverrichtingen bevat. Alle bedragen betreffen sector S13. We tellen geen afzonderlijke Belgische overheidsbegrotingen bij elkaar op.</p><p>Politieke vergoedingen en kabinetten zijn hierin niet voor alle landen afzonderlijk geïsoleerd. Ook afzonderlijke kosten van burgemeesters zijn hiermee niet vastgesteld. De personeelsbedragen zijn onderdelen van ruimere uitgaven; tel de keuzes uit het keuzemenu niet op.</p><p>Euro per inwoner = miljoen euro × 1.000.000 ÷ gemiddelde jaarbevolking. PPS per inwoner = euro per inwoner ÷ bbp-koopkrachtpariteit (EU27=1). Een hogere uitgave bewijst geen hogere kwaliteit of lagere efficiëntie.</p><ul className="list-disc space-y-2 pl-5">{[moneySource, sourceLink("population"), sourceLink("ppp")].map((source) => <li key={source.url}><a href={source.url} className="inline-block py-1 text-accent underline underline-offset-4">{source.label}</a></li>)}</ul></div></details>
      </div>
    </section>
  );
}

export function AdministrationCostTrend() {
  const [mode, setMode] = useState<TrendMode>("real");
  const data = comparisonTrendYears.map((year) => Object.fromEntries([["year", String(year)], ...countries.map((country) => [country.code, trendObservation(country.code, year, mode).value])]));
  return (
    <section id="evolutie-bestuurskosten" aria-labelledby="kosten-evolutie-titel" className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 id="kosten-evolutie-titel" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">Hoe veranderen de bestuurskosten?</h2>
      <p className="mt-3 max-w-2xl text-foreground-muted">Dezelfde bestuurspost (COFOG 01.1) per inwoner, van 2019 tot en met 2024. Elk land begint op 100. De lijnen tonen de verandering binnen elk land, niet welk land het meeste uitgeeft.</p>
      <div aria-label="Inflatiecorrectie voor kostenevolutie" className="mt-6 flex flex-wrap gap-2">{[{ value: "real", label: "Gecorrigeerd voor inflatie" }, { value: "nominal", label: "Zonder inflatiecorrectie" }].map((choice) => <button key={choice.value} type="button" aria-pressed={mode === choice.value} onClick={() => setMode(choice.value as TrendMode)} className={`min-h-11 rounded-sm border px-4 py-2 text-sm font-medium ${mode === choice.value ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-foreground-muted hover:border-foreground-muted"}`}>{choice.label}</button>)}</div>
      <figure className="mt-6 rounded-lg border border-border bg-surface p-3 sm:p-6">
        <figcaption className="mb-5 text-sm font-medium">Index per inwoner · 2019 = 100 · {mode === "real" ? "consumentenprijzen van 2019" : "lopende euro’s"}</figcaption>
        <div role="img" aria-label={`Kostenevolutie voor vijf landen, ${mode === "real" ? "gecorrigeerd voor inflatie" : "zonder inflatiecorrectie"}; exacte waarden in de tabel hieronder`} className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--foreground-muted)" }} tickLine={false} /><YAxis width={44} tick={{ fontSize: 12, fill: "var(--foreground-muted)" }} tickLine={false} domain={['auto', 'auto']} /><Tooltip formatter={(value: number, name: string) => [number(value), countries.find((c) => c.code === name)?.name ?? name]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }} />{countries.map((country, index) => <Line key={country.code} dataKey={country.code} type="linear" stroke={`var(--data-series-${index + 1})`} strokeWidth={country.code === "BE" ? 3 : 2} dot={{ r: 3 }} isAnimationActive={false} connectNulls={false} />)}</LineChart></ResponsiveContainer></div>
        <ul aria-label="Legenda kostenevolutie" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-foreground-muted">{countries.map((country, index) => <li key={country.code} className="flex items-center gap-2"><span aria-hidden="true" className="h-0.5 w-5" style={{ backgroundColor: `var(--data-series-${index + 1})` }} />{country.name}</li>)}</ul>
      </figure>
      <FiveCountryTable caption={`Jaarlijkse kostenevolutie · 2019 = 100 · ${mode === "real" ? "inflatiegecorrigeerd" : "nominaal"}`} rows={comparisonTrendYears.map((year) => ({ key: String(year), label: String(year), values: countries.map((country) => { const value = trendObservation(country.code, year, mode); return { code: country.code, display: value.value === null ? "Niet beschikbaar" : number(value.value), status: value.status }; }) }))} />
      <details className="mt-6 border-t border-border pt-3 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium">Bedragen, inflatiecorrectie en bronnen</summary><div className="mt-3 max-w-3xl space-y-3 text-foreground-muted"><p>Elk jaar delen we de uitgaven door de gemiddelde bevolking van datzelfde jaar. Voor de inflatiecorrectie vermenigvuldigen we met HICP 2019 ÷ HICP van dat jaar. Daarna delen we door het bedrag per inwoner in 2019 en vermenigvuldigen we met 100.</p><p>HICP meet consumentenprijzen. Bestuurskosten hebben een andere mix van lonen, diensten en investeringen. De reële reeks is daarom een benadering, geen sectorale volumemeting. De pandemie, beleidswijzigingen, herclassificaties en bevolkingsherzieningen kunnen de reeks beïnvloeden.</p><p>Dit is een andere correctie dan PPS: HICP vergelijkt prijzen doorheen de tijd binnen een land; PPS vergelijkt prijsniveaus tussen landen in één jaar.</p><ul className="list-disc space-y-2 pl-5">{[sourceLink("spending"), sourceLink("population"), sourceLink("hicp")].map((source) => <li key={source.url}><a href={source.url} className="inline-block py-1 text-accent underline underline-offset-4">{source.label}</a></li>)}</ul></div></details>
      <FiveCountryTable caption="Bestuurspost per inwoner in 2024 · dezelfde bedragen, twee prijsbasissen" rows={[
        { key: "nominal", label: "Euro per inwoner, prijzen van 2024", values: countries.map((country) => { const value = costObservation(country.code, "administration"); return { code: country.code, display: value.value === null ? "Niet beschikbaar" : formatCurrency(value.value), status: value.status }; }) },
        { key: "real", label: "Euro per inwoner, consumentenprijzen van 2019", values: countries.map((country) => { const value = realCostPerResident(country.code, 2024); return { code: country.code, display: value.value === null ? "Niet beschikbaar" : formatCurrency(value.value), status: value.status }; }) },
      ]} />
    </section>
  );
}
