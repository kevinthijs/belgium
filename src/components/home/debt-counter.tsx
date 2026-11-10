"use client";

import * as Popover from "@radix-ui/react-popover";
import { useEstimatedDebtCounter } from "./use-estimated-debt-counter";
import { formatCurrency, formatCompactCurrency, formatPeriod } from "@/lib/format/money";
import { DataStatusBadge } from "@/components/data/data-status-badge";
import { getMessages } from "@/i18n";
import type { DebtHeroData } from "@/server/queries/homepage";

export function DebtCounter({ data, renderedAt }: { data: DebtHeroData; renderedAt: number }) {
  const t = getMessages();
  const { estimatedCurrentDebt, changePerSecond, isIncreasing } = useEstimatedDebtCounter({
    referenceValue: data.referenceValue,
    referenceTimestamp: data.referenceTimestamp,
    estimatedAnnualChange: data.estimatedAnnualChange,
    initialTimestampMs: renderedAt,
  });

  return (
    <div>
      <p className="text-sm font-medium text-foreground-muted">{t.debtCounter.title}</p>
      <p className="mt-3 whitespace-nowrap tabular-nums text-[clamp(1.5rem,6.8vw,5rem)] font-semibold leading-tight tracking-[-0.03em] text-foreground">
        {formatCurrency(estimatedCurrentDebt)}
      </p>
      <p className="mt-2 tabular-nums text-sm text-foreground-muted">
        {isIncreasing ? "+" : ""}
        {formatCompactCurrency(changePerSecond)} {t.debtCounter.perSecond}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground-subtle">
        <span>{t.debtCounter.disclaimerLine1}</span>
        <span className="font-medium text-status-warning">{t.debtCounter.disclaimerLine2}</span>
      </div>

      <p className="mt-2 text-xs text-foreground-subtle">
        {t.metrics.lastObservation}: <span className="font-medium text-foreground">{formatCurrency(data.referenceValue)}</span>{" "}
        ({formatPeriod(data.observationPeriod)})
      </p>

      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center rounded-sm border border-border px-3 py-2 text-xs font-medium text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            {t.debtCounter.methodologyButton}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={8} className="z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface p-4 text-sm shadow-lg">
            <dl className="space-y-2">
              <Row label="Laatste officiële meting" value={formatCurrency(data.referenceValue)} />
              <Row label="Periode" value={formatPeriod(data.observationPeriod)} />
              <Row label="Bron" value={data.source.organisation} />
              <Row label="Dataset" value={data.source.dataset} />
              <div className="flex items-center justify-between pt-1">
                <dt className="text-foreground-subtle">Status</dt>
                <DataStatusBadge status={data.source.status} />
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-foreground-subtle">{data.methodologyDescription}</p>
            {data.source.datasetUrl ? (
              <a
                href={data.source.datasetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-medium text-accent underline underline-offset-2"
              >
                Bekijk bron →
              </a>
            ) : null}
            <Popover.Arrow className="fill-surface" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function DebtCounterUnavailable({ reason }: { reason: string }) {
  const t = getMessages();
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">{t.debtCounter.title}</p>
      <p className="mt-3 text-sm text-foreground-subtle">{reason}</p>
    </div>
  );
}
