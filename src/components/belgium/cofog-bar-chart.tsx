"use client";

import { useMemo, useState } from "react";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { formatCompactCurrency, formatPerCapita, formatPercentage } from "@/lib/format/money";
import type { CofogCategoryDisplay } from "@/server/queries/finance";

type Unit = "EUR" | "PER_CAPITA" | "SHARE";

const UNIT_LABELS: Record<Unit, string> = {
  EUR: "€ miljard",
  PER_CAPITA: "€ per inwoner",
  SHARE: "% totale uitgaven",
};

export function CofogBarChart({
  categories,
  population,
}: {
  categories: CofogCategoryDisplay[];
  population: number | null;
}) {
  const availableUnits: Unit[] = population ? ["EUR", "PER_CAPITA", "SHARE"] : ["EUR", "SHARE"];
  const [unit, setUnit] = useState<Unit>("EUR");

  const data = useMemo(
    () =>
      categories.map((c) => {
        const eur = Number(c.valueEUR);
        const value = unit === "EUR" ? eur : unit === "SHARE" ? Number(c.share) : population ? eur / population : 0;
        return { label: c.label, value, highlighted: false };
      }),
    [categories, unit, population],
  );

  const formatter = unit === "EUR" ? formatCompactCurrency : unit === "PER_CAPITA" ? formatPerCapita : formatPercentage;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Eenheid">
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
      <HorizontalBarChart data={data} ariaLabel="Overheidsuitgaven per COFOG-functie" valueFormatter={formatter} />
    </div>
  );
}
