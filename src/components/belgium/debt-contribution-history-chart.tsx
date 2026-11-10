"use client";

import { useMemo, useState } from "react";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import type { GovernmentSectorSlug } from "@/server/queries/government-sectors";

export interface DebtContributionHistorySeries {
  slug: GovernmentSectorSlug;
  label: string;
  points: Array<{ period: string; value: string }>;
}

/**
 * One selectable sector at a time (never all four by default) — plotting
 * all four together made the chart unreadable given how much larger
 * S1311's contribution is than the other three (see docs/GOVERNMENT_SUBSECTORS.md).
 */
export function DebtContributionHistoryChart({ series }: { series: DebtContributionHistorySeries[] }) {
  const [slug, setSlug] = useState(series[0]?.slug ?? "");
  const selected = series.find((s) => s.slug === slug) ?? series[0]!;

  const data = useMemo(
    () => selected.points.map((p) => ({ period: p.period, value: Number(p.value), status: "FINAL" })),
    [selected],
  );

  return (
    <div>
      <label className="mb-4 flex flex-col gap-1 text-sm sm:max-w-xs">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Deelsector</span>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
        >
          {series.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <TimeSeriesChart data={data} ariaLabel={`Evolutie van de bijdrage van ${selected.label} aan de overheidsschuld`} />
    </div>
  );
}
