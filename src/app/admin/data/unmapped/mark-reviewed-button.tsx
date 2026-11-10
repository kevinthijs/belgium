"use client";

import { useTransition } from "react";
import { markIgnoredExpectedAction, markReviewedAction } from "./actions";

export function MarkReviewedButton({ datasetCode, dimension, rawValue }: { datasetCode: string; dimension: string; rawValue: string }) {
  const [isPending, startTransition] = useTransition();

  function handleReview() {
    if (!window.confirm(`"${rawValue}" markeren als beoordeeld? De ongemapte waarde blijft bewaard, alleen de status wijzigt.`)) return;
    startTransition(async () => {
      await markReviewedAction(datasetCode, dimension, rawValue);
    });
  }

  function handleIgnore() {
    if (!window.confirm(`"${rawValue}" markeren als verwacht/genegeerd? Gebruik dit voor waarden die bewust nooit gemapt worden.`)) return;
    startTransition(async () => {
      await markIgnoredExpectedAction(datasetCode, dimension, rawValue);
    });
  }

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={handleReview}
        disabled={isPending}
        className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-muted disabled:opacity-50"
      >
        {isPending ? "Bezig…" : "Beoordeeld"}
      </button>
      <button
        type="button"
        onClick={handleIgnore}
        disabled={isPending}
        className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-foreground-subtle hover:bg-surface-muted disabled:opacity-50"
      >
        Verwacht/negeren
      </button>
    </div>
  );
}
