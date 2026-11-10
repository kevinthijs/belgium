"use client";

import { useMemo, useState } from "react";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import type { CofogHistorySeries } from "@/server/queries/finance";

export function CofogHistoryChart({ series }: { series: CofogHistorySeries[] }) {
  const [code, setCode] = useState(series[0]?.code ?? "");
  const selected = series.find((s) => s.code === code) ?? series[0]!;

  const data = useMemo(
    () => selected.points.map((p) => ({ period: String(p.year), value: Number(p.valueEUR), status: "FINAL" })),
    [selected],
  );

  return (
    <div>
      <label className="mb-4 flex flex-col gap-1 text-sm sm:max-w-xs">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Functie</span>
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
        >
          {series.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <TimeSeriesChart data={data} ariaLabel={`Evolutie van uitgaven aan ${selected.label}`} />
    </div>
  );
}
