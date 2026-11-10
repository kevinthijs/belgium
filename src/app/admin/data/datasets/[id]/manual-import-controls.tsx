"use client";

import { useState, useTransition } from "react";
import { checkSourceAction, triggerImportAction } from "./actions";

export function ManualImportControls({ datasetId }: { datasetId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleCheck() {
    setMessage(null);
    startTransition(async () => {
      const result = await checkSourceAction(datasetId);
      setMessage(result.ok ? `Bron gecontroleerd: ${result.reason}` : `Fout: ${result.error}`);
    });
  }

  function handleImport() {
    if (!window.confirm("Handmatige import starten voor deze dataset? Dit haalt live data op bij de bron.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await triggerImportAction(datasetId);
      setMessage(
        result.ok
          ? `Import voltooid: ${result.created} aangemaakt, ${result.updated} bijgewerkt, ${result.rejected} afgewezen, ${result.filtered} verwacht uitgesloten.`
          : `Fout: ${result.error}`,
      );
    });
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-muted px-3 py-2.5">
      <button
        type="button"
        onClick={handleCheck}
        disabled={isPending}
        className="rounded-sm border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
      >
        Bron controleren
      </button>
      <button
        type="button"
        onClick={handleImport}
        disabled={isPending}
        className="rounded-sm border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        Import starten
      </button>
      {isPending ? <span className="text-sm text-foreground-subtle">Bezig…</span> : null}
      {message ? <span className="text-sm text-foreground-muted">{message}</span> : null}
    </div>
  );
}
