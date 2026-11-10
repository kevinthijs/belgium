"use client";

import { useId, useState } from "react";
import { formatPercentage } from "@/lib/format/money";
import { comparisonCountries, comparisonMetrics } from "@/data/reference/country-comparison";

export function CountryComparisonChart() {
  const selectId = useId();
  const descriptionId = useId();
  const [selectedKey, setSelectedKey] = useState(comparisonMetrics[0]!.key);
  const selected = comparisonMetrics.find((metric) => metric.key === selectedKey)!;

  const values = comparisonCountries.map((country) => country[selected.key]);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = maximum - minimum || 1;

  return (
    <div className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-8">
      <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
        Kies een onderwerp
      </label>
      <select
        id={selectId}
        value={selectedKey}
        onChange={(event) => {
          const metric = comparisonMetrics.find((item) => item.key === event.target.value);
          if (metric) setSelectedKey(metric.key);
        }}
        aria-describedby={descriptionId}
        className="mt-2 w-full rounded-md border border-border bg-surface min-h-11 px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:max-w-lg"
      >
        {comparisonMetrics.map((metric) => (
          <option key={metric.key} value={metric.key}>{metric.label} · {metric.year}</option>
        ))}
      </select>
      <div id={descriptionId} className="mt-5" aria-live="polite" aria-atomic="true">
        <h3 className="text-base font-semibold text-foreground">{selected.label} · {selected.year}</h3>
        <p className="mt-1 text-sm text-foreground-muted">{selected.unit}</p>
        <p className="mt-3 max-w-2xl text-sm text-foreground-muted">{selected.definition}</p>
      </div>
      <dl className="my-7 space-y-5" aria-label={`${selected.label}, ${selected.year}, ${selected.unit}`}>
        {comparisonCountries.map((country) => {
          const value = country[selected.key];
          return (
            <div key={country.code} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 sm:grid-cols-[7rem_1fr_6rem] sm:gap-5">
              <dt className={`text-sm ${country.code === "BE" ? "font-semibold text-accent" : "text-foreground-muted"}`}>{country.name}</dt>
              <dd aria-hidden="true" className="relative h-5 bg-surface-muted">
                <span className="absolute inset-y-0 border-l border-foreground-subtle" style={{ left: `${-minimum / range * 100}%` }} />
                <span className={`absolute inset-y-0 rounded-sm ${country.code === "BE" ? "bg-accent" : "bg-data-series-2"}`} style={{ left: `${(Math.min(0, value) - minimum) / range * 100}%`, width: `${Math.abs(value) / range * 100}%` }} />
              </dd>
              <dd className="text-right text-xl font-semibold tabular-nums sm:text-2xl">{formatPercentage(value)}</dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-4 max-w-2xl text-sm text-foreground-muted">{selected.caveat}</p>
      <a href={selected.source.url} className="mt-3 inline-block text-sm text-accent underline underline-offset-2">
        {selected.source.label}
      </a>
      <p className="mt-3 text-xs text-foreground-subtle">De exacte waarden staan ook in de tabel hieronder.</p>
    </div>
  );
}
