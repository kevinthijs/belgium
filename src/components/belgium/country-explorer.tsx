"use client";

import { useId, useState } from "react";
import { ArrowUpRight, MapPinned, RotateCcw } from "lucide-react";
import geography from "@/data/reference/europe-country-map.json";
import {
  explorerCountries, explorerMetrics, explorerSource, explorerUnit, explorerValues, explorerYear,
  type ExplorerMetricKey,
} from "@/data/reference/country-explorer";
import { costMetrics, observationNote, type CompleteCountryCode, type CostUnit } from "@/data/reference/complete-country-comparison";
import { compareCountryValues } from "@/data/derivations/relative-comparison";
import { formatCurrency, formatInteger, formatPercentage } from "@/lib/format/money";

const decimal = (value: number, digits = 2) => new Intl.NumberFormat("nl-BE", { maximumFractionDigits: digits }).format(value);
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${decimal(Math.abs(value))}`;
const mix = (from: number[], to: number[], amount: number) => `rgb(${from.map((value, index) => Math.round(value + (to[index]! - value) * Math.max(0, Math.min(1, amount)))).join(",")})`;

export function CountryExplorer() {
  const id = useId().replace(/:/g, "");
  const [metricKey, setMetricKey] = useState<ExplorerMetricKey>("administration");
  const [unit, setUnit] = useState<CostUnit>("gdp");
  const [referenceCode, setReferenceCode] = useState<CompleteCountryCode>("BE");
  const [selectedCode, setSelectedCode] = useState<CompleteCountryCode>("FR");
  const [mapMode, setMapMode] = useState<"relative" | "value">("relative");
  const metric = explorerMetrics.find((item) => item.key === metricKey)!;
  const values = explorerValues(metricKey, unit);
  const reference = values.find((country) => country.code === referenceCode)!;
  const selected = values.find((country) => country.code === selectedCode)!;
  const percentage = metric.kind === "share" || unit === "gdp";
  const comparison = compareCountryValues(selected.value, reference.value);
  const validValues = values.flatMap((country) => country.value === null ? [] : [country.value]);
  const minimum = Math.min(...validValues);
  const maximum = Math.max(...validValues);
  const relativeMaximum = Math.max(0, ...values.map((country) => Math.abs(compareCountryValues(country.value, reference.value)?.relativePercent ?? 0)));
  const barMaximum = Math.max(1, ...validValues);
  const source = explorerSource(metric);
  const unitLabel = explorerUnit(metric, unit);
  const formatted = (value: number | null) => value === null ? "Geen gegevens" : percentage ? formatPercentage(value) : unit === "pps" ? `${formatInteger(value)} PPS` : formatCurrency(value);
  const color = (code: string) => {
    const country = values.find((value) => value.code === code);
    if (country?.value === undefined || country.value === null) return "var(--map-context)";
    if (mapMode === "value") return mix([246, 234, 206], [161, 105, 25], (country.value - minimum) / (maximum - minimum || 1));
    const relative = compareCountryValues(country.value, reference.value)?.relativePercent;
    if (relative === null || relative === undefined) return "var(--map-context)";
    return relative < 0 ? mix([237, 233, 222], [42, 82, 116], Math.abs(relative) / (relativeMaximum || 1)) : mix([237, 233, 222], [168, 108, 25], relative / (relativeMaximum || 1));
  };
  const reset = () => { setMetricKey("administration"); setUnit("gdp"); setReferenceCode("BE"); setSelectedCode("FR"); setMapMode("relative"); };

  return (
    <section id="landenkaart" aria-labelledby={`${id}-title`} className="country-explorer border-y border-border">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 id={`${id}-title`} className="max-w-3xl text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight">Waar zitten de verschillen?</h2>
            <p className="mt-3 max-w-2xl text-foreground-muted">Verken vijf landen op de kaart. Vergelijk hun cijfers én de verhouding ertussen, met hetzelfde jaar en dezelfde noemer per onderwerp.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-foreground-muted"><MapPinned aria-hidden="true" className="h-4 w-4" />Europa · {explorerYear}</span>
        </div>

        <div className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-[1.6fr_1fr] lg:grid-cols-[1.4fr_1fr_1.4fr] lg:gap-6">
          <div>
            <label htmlFor={`${id}-metric`} className="block text-sm font-medium">Onderwerp op de kaart</label>
            <select id={`${id}-metric`} value={metricKey} onChange={(event) => { const next = explorerMetrics.find((item) => item.key === event.target.value); if (next) setMetricKey(next.key); }} className="mt-2 min-h-11 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              {explorerMetrics.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-reference`} className="block text-sm font-medium">Vergelijk met</label>
            <select id={`${id}-reference`} value={referenceCode} onChange={(event) => { const next = explorerCountries.find((item) => item.code === event.target.value); if (next) setReferenceCode(next.code as CompleteCountryCode); }} className="mt-2 min-h-11 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              {explorerCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            {metric.kind === "cost" ? <>
              <span className="block text-sm font-medium">Bekijk als</span>
              <div role="group" aria-label="Eenheid op de landenkaart" className="mt-2 flex flex-wrap gap-2">{[{ value: "gdp", label: "% van bbp" }, { value: "euro", label: "€ per inwoner" }, { value: "pps", label: "PPS" }].map((choice) => <button key={choice.value} type="button" aria-pressed={unit === choice.value} onClick={() => setUnit(choice.value as CostUnit)} className={`explorer-control min-h-11 rounded-sm border px-3 py-2 text-xs font-medium ${unit === choice.value ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-foreground-muted hover:border-foreground-muted"}`}>{choice.label}</button>)}</div>
            </> : <p className="pt-1 text-sm text-foreground-muted">Eenheid<br /><strong className="mt-2 inline-block font-medium text-foreground">{unitLabel}</strong></p>}
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <figure className="min-w-0">
            <div role="group" aria-label="Kleurweergave van de kaart" className="mb-3 flex flex-wrap gap-1 text-xs">
              <button type="button" aria-pressed={mapMode === "relative"} onClick={() => setMapMode("relative")} className={`explorer-control min-h-11 rounded-sm px-3 py-2 font-medium ${mapMode === "relative" ? "bg-foreground text-background" : "text-foreground-muted hover:bg-surface-muted"}`}>Verschil met {reference.name}</button>
              <button type="button" aria-pressed={mapMode === "value"} onClick={() => setMapMode("value")} className={`explorer-control min-h-11 rounded-sm px-3 py-2 font-medium ${mapMode === "value" ? "bg-foreground text-background" : "text-foreground-muted hover:bg-surface-muted"}`}>Waarde per land</button>
            </div>
            <div className="country-map-surface relative overflow-hidden rounded-lg border border-border" style={{ aspectRatio: `${geography.width} / ${geography.height}` }}>
              <svg viewBox={`0 0 ${geography.width} ${geography.height}`} className="absolute inset-0 h-full w-full" aria-labelledby={`${id}-map-title ${id}-map-description`}>
                <title id={`${id}-map-title`}>{`${metric.label}: vijf landen vergelijken`}</title>
                <desc id={`${id}-map-description`}>{`Selecteer een ingekleurd land of gebruik de landknoppen onder de kaart. Grijze landen zijn niet opgenomen in deze vergelijking. ${mapMode === "relative" ? `Kleur toont het relatieve procentuele verschil met ${reference.name}.` : "Kleur toont de waarde van het gekozen onderwerp."}`}</desc>
                <defs><clipPath id={`${id}-clip`}><rect width={geography.width} height={geography.height} /></clipPath></defs>
                <g clipPath={`url(#${id}-clip)`}>
                  {geography.features.filter((feature) => !values.some((country) => country.code === feature.code)).map((feature) => <path key={`${feature.code}-${feature.name}`} d={feature.path} fill="var(--map-context)" stroke="var(--map-coast)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" aria-hidden="true" />)}
                  {values.map((country) => {
                    const feature = geography.features.find((item) => item.code === country.code)!;
                    const label = geography.labels[country.code as keyof typeof geography.labels];
                    return <g key={country.code} className="country-map-choice" role="button" tabIndex={0} aria-pressed={selectedCode === country.code} aria-label={`${country.name}: ${formatted(country.value)}. Selecteer voor vergelijking met ${reference.name}.`} onClick={() => setSelectedCode(country.code as CompleteCountryCode)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedCode(country.code as CompleteCountryCode); } }}>
                      <path className="country-map-land" d={feature.path} fill={color(country.code)} stroke={country.code === referenceCode ? "var(--accent)" : "var(--map-coast)"} strokeWidth={country.code === referenceCode ? 2 : 1.3} vectorEffect="non-scaling-stroke" />
                      {selectedCode === country.code ? <path key={`selected-${country.code}`} className="country-map-trace" d={feature.path} fill="none" stroke="var(--foreground)" strokeWidth="2.5" pathLength="1" vectorEffect="non-scaling-stroke" aria-hidden="true" /> : null}
                      {country.code === "BE" || country.code === "NL" ? <line x1={label.anchor[0]} y1={label.anchor[1]} x2={label.label[0]} y2={label.label[1]} stroke="var(--foreground-muted)" strokeWidth="1" vectorEffect="non-scaling-stroke" aria-hidden="true" /> : null}
                    </g>;
                  })}
                </g>
              </svg>
              {values.map((country) => {
                const point = geography.labels[country.code as keyof typeof geography.labels].label;
                return <div key={country.code} aria-hidden="true" className={`country-map-label pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 ${selectedCode === country.code ? "is-selected" : ""}`} style={{ left: `${point[0]! / geography.width * 100}%`, top: `${point[1]! / geography.height * 100}%` }}><span className="block text-[10px] leading-tight text-foreground-muted sm:text-xs">{country.name}{country.code === referenceCode ? " · ref." : ""}</span><strong className="mt-0.5 block whitespace-nowrap text-xs leading-tight tabular-nums sm:text-sm">{formatted(country.value)}</strong></div>;
              })}
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] items-start gap-4 text-xs text-foreground-muted">
              <div><div className="h-2 rounded-sm" style={{ background: mapMode === "relative" ? "linear-gradient(90deg,rgb(42,82,116),rgb(237,233,222),rgb(168,108,25))" : "linear-gradient(90deg,rgb(246,234,206),rgb(161,105,25))" }} /><div className="mt-2 flex justify-between gap-3"><span>{mapMode === "relative" ? `−${decimal(relativeMaximum, 1)}%` : formatted(minimum)}</span>{mapMode === "relative" ? <span>{reference.name}: 0%</span> : null}<span>{mapMode === "relative" ? `+${decimal(relativeMaximum, 1)}%` : formatted(maximum)}</span></div></div>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--map-context)]" aria-hidden="true" />Niet vergeleken</span>
            </div>
            <figcaption className="mt-3 text-xs leading-relaxed text-foreground-muted">{mapMode === "relative" ? `De kleuren tonen een relatief verschil met ${reference.name}, geen oordeel over kwaliteit.` : `Kleur toont ${unitLabel}, van laag naar hoog.`} De kaart toont Europees grondgebied; de cijfers volgen de nationale afbakening van de bron.</figcaption>
            <div role="group" aria-label="Selecteer een land om te vergelijken" className="mt-4 flex flex-wrap gap-2">{explorerCountries.map((country) => <button key={country.code} type="button" aria-pressed={selectedCode === country.code} onClick={() => setSelectedCode(country.code as CompleteCountryCode)} className={`explorer-control min-h-11 rounded-sm border px-3 py-2 text-xs font-medium ${selectedCode === country.code ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-foreground-muted hover:border-foreground-muted"}`}>{country.name}</button>)}</div>
          </figure>

          <div className="min-w-0 lg:pt-14">
            <div aria-live="polite" aria-atomic="true">
              <h3 className="text-2xl font-semibold tracking-tight">{selected.name} naast {reference.name}</h3>
              <p className="mt-2 text-sm text-foreground-muted">{metric.label} · {explorerYear} · {unitLabel}</p>
              <dl className="my-7 space-y-5">{[reference, selected].map((country, index) => <div key={`${country.code}-${index}`}><div className="flex items-baseline justify-between gap-4"><dt className="text-sm text-foreground-muted">{country.name}{index === 0 ? " · referentie" : ""}</dt><dd className="text-2xl font-semibold tabular-nums">{formatted(country.value)}</dd></div><div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-sm bg-border"><div className={`comparison-bar h-full w-full rounded-sm ${index === 0 ? "bg-accent" : "bg-data-series-2"}`} style={{ transform: `scaleX(${(country.value ?? 0) / barMaximum})` }} /></div>{country.status ? <p className="mt-1 text-xs text-foreground-muted">{observationNote(country.status)}</p> : null}</div>)}</dl>
              <dl className="grid grid-cols-2 gap-5 border-y border-border py-6">
                <div><dt className="text-xs text-foreground-muted">{percentage ? "Verschil in procentpunten" : "Verschil per inwoner"}</dt><dd key={`${metricKey}-${unit}-${referenceCode}-${selectedCode}-difference`} className="comparison-value-change mt-2 text-2xl font-semibold tabular-nums">{comparison ? percentage ? `${signed(comparison.difference)} pp` : `${comparison.difference > 0 ? "+" : comparison.difference < 0 ? "−" : ""}${unit === "pps" ? `${formatInteger(Math.abs(comparison.difference))} PPS` : formatCurrency(Math.abs(comparison.difference))}` : "Onbekend"}</dd></div>
                <div><dt className="text-xs text-foreground-muted">Relatief verschil</dt><dd key={`${metricKey}-${unit}-${referenceCode}-${selectedCode}-relative`} className="comparison-value-change mt-2 text-2xl font-semibold tabular-nums">{comparison?.relativePercent === null || !comparison ? "Niet berekenbaar" : `${signed(comparison.relativePercent)}%`}</dd></div>
              </dl>
              <p className="mt-5 text-sm text-foreground-muted">{comparison ? comparison.difference === 0 ? `${selected.name} heeft dezelfde waarde als de referentie.` : <>{selected.name} ligt <strong className="font-semibold text-foreground">{percentage ? `${decimal(Math.abs(comparison.difference))} procentpunt` : unit === "pps" ? `${formatInteger(Math.abs(comparison.difference))} PPS per inwoner` : `${formatCurrency(Math.abs(comparison.difference))} per inwoner`} {comparison.difference > 0 ? "hoger" : "lager"}</strong> dan {reference.name}.{comparison.relativePercent !== null ? ` Relatief is dat ${decimal(Math.abs(comparison.relativePercent), 1)}% ${comparison.difference > 0 ? "hoger" : "lager"}.` : " De referentiewaarde is nul; een relatief percentage is daarom niet te berekenen."}</> : "Voor deze keuze zijn geen vergelijkbare gegevens beschikbaar."}</p>
            </div>
            <p className="mt-5 text-sm text-foreground-muted">{metric.definition}</p>
            {metric.kind === "cost" ? <p className="mt-3 text-sm text-foreground-muted">{costMetrics.find((item) => item.key === metric.costKey)!.caveat}</p> : null}
            {metric.kind === "cost" && unit === "pps" ? <p className="mt-3 text-sm text-foreground-muted">PPS gebruikt hier de bbp-koopkrachtpariteit als brede prijsniveaucorrectie, niet de specifieke prijzen van publieke diensten.</p> : null}
            <details className="mt-5 border-t border-border pt-2 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium">Percentages begrijpen en bron bekijken</summary><div className="mt-3 space-y-3 text-foreground-muted"><p>Procentpunten = aandeel van het gekozen land − aandeel van het referentieland. Relatief verschil = (waarde − referentiewaarde) ÷ absolute referentiewaarde × 100. Een referentiewaarde van nul geeft geen berekenbaar relatief percentage.</p><p>Bijvoorbeeld: 2% tegenover 1% is 1 procentpunt verschil en 100% relatief verschil. Percentages van landen worden niet bij elkaar opgeteld: ieder land heeft zijn eigen noemer.</p><a href={source.url} className="inline-flex min-h-11 items-center gap-1 text-accent underline underline-offset-4">{source.label}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></a><p className="text-xs">Grenzen: <a href={geography.termsUrl} className="underline underline-offset-4">Natural Earth, publiek domein</a>. Niet-ingekleurde landen hebben in deze kaart geen vergelijkingsgegevens.</p></div></details>
            <button type="button" onClick={reset} className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-foreground-muted underline underline-offset-4 hover:text-foreground"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />Terug naar België en Frankrijk</button>
          </div>
        </div>
      </div>
    </section>
  );
}
