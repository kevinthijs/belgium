"use client";

import { useMemo, useState } from "react";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { formatCompactCurrency, formatPerCapita, formatPercentage } from "@/lib/format/money";

export interface FinancialHistoryPoint {
  period: string;
  year: number;
  eur: string;
  pctGdp: string | null;
  perCapita: string | null;
  status: string;
}

type Unit = "EUR" | "PCT_GDP" | "PER_CAPITA";
type Range = "10j" | "20j" | "1995" | "alles";

const UNIT_LABELS: Record<Unit, string> = {
  EUR: "€ miljard",
  PCT_GDP: "% bbp",
  PER_CAPITA: "€ per inwoner",
};

const RANGE_LABELS: Record<Range, string> = {
  "10j": "10 jaar",
  "20j": "20 jaar",
  "1995": "Sinds 1995",
  alles: "Alles",
};

export function FinancialMetricHistory({
  data,
  ariaLabel,
  availableUnits = ["EUR", "PCT_GDP", "PER_CAPITA"],
}: {
  data: FinancialHistoryPoint[];
  ariaLabel: string;
  availableUnits?: Unit[];
}) {
  const [unit, setUnit] = useState<Unit>(availableUnits[0] ?? "EUR");
  const [range, setRange] = useState<Range>("1995");

  const latestYear = data.length > 0 ? data[data.length - 1]!.year : new Date().getFullYear();
  const filtered = useMemo(() => {
    const cutoffYear =
      range === "10j" ? latestYear - 10 : range === "20j" ? latestYear - 20 : range === "1995" ? 1995 : -Infinity;
    return data.filter((d) => d.year >= cutoffYear);
  }, [data, range, latestYear]);

  const chartData = useMemo(
    () =>
      filtered
        .map((d) => {
          const raw = unit === "EUR" ? d.eur : unit === "PCT_GDP" ? d.pctGdp : d.perCapita;
          if (raw === null) return null;
          return { period: d.period, value: Number(raw), status: d.status };
        })
        .filter((d): d is { period: string; value: number; status: string } => d !== null),
    [filtered, unit],
  );

  const formatter =
    unit === "EUR" ? formatCompactCurrency : unit === "PCT_GDP" ? formatPercentage : formatPerCapita;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Eenheid">
          {availableUnits.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              className={`rounded-sm border px-2.5 py-1 text-xs font-medium ${
                unit === u
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-foreground-muted hover:bg-surface-muted"
              }`}
            >
              {UNIT_LABELS[u]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Periode">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-sm border px-2.5 py-1 text-xs font-medium ${
                range === r
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-foreground-muted hover:bg-surface-muted"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground-subtle">
          Geen gegevens beschikbaar voor deze combinatie van eenheid en periode.
        </p>
      ) : (
        <TimeSeriesChart data={chartData} ariaLabel={ariaLabel} valueFormatter={formatter} />
      )}
    </div>
  );
}
