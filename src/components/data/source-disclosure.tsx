"use client";

import * as Popover from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { DataStatusBadge } from "./data-status-badge";
import type { SourceReference } from "@/server/queries/types";
import { formatPeriod } from "@/lib/format/money";

export function SourceDisclosure({ source, label = "Bron" }: { source: SourceReference; label?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1 text-xs text-foreground-subtle underline decoration-dotted underline-offset-2 transition hover:text-foreground-muted"
        >
          <Info aria-hidden className="h-3 w-3" />
          {label}: {source.organisation}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-50 w-[300px] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface p-4 text-sm shadow-lg animate-fade-in"
        >
          <dl className="space-y-2">
            <Row label="Organisatie" value={source.organisation} />
            <Row label="Dataset" value={source.dataset} />
            <Row label="Periode" value={formatPeriod(source.period)} />
            <Row
              label="Gepubliceerd"
              value={source.publishedAt ? new Date(source.publishedAt).toLocaleDateString("nl-BE") : "Onbekend"}
            />
            {source.framework ? <Row label="Kader" value={source.framework} /> : null}
            <div className="flex items-center justify-between pt-1">
              <dt className="text-foreground-subtle">Status</dt>
              <DataStatusBadge status={source.status} />
            </div>
          </dl>
          {source.isDemoData ? (
            <p className="mt-3 rounded-sm bg-status-warning/10 px-2 py-1 text-xs font-semibold text-status-warning">
              DEMO DATA — geen officiële cijfers
            </p>
          ) : null}
          {source.datasetUrl ? (
            <a
              href={source.datasetUrl}
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
