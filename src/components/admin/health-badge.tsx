import { cn } from "@/lib/utils";
import type { HealthState } from "@/server/admin/dataset-health";

const HEALTH_STYLE: Record<HealthState, string> = {
  HEALTHY: "border-[color:var(--status-final)]/40 text-[color:var(--status-final)]",
  WARNING: "border-[color:var(--status-warning)]/40 text-[color:var(--status-warning)]",
  STALE: "border-[color:var(--status-estimated)]/40 text-[color:var(--status-estimated)]",
  FAILED: "border-[color:var(--status-error)]/40 text-[color:var(--status-error)]",
  NEVER_IMPORTED: "border-border text-foreground-muted",
};

const HEALTH_ICON: Record<HealthState, string> = {
  HEALTHY: "✓",
  WARNING: "!",
  STALE: "⏱",
  FAILED: "✕",
  NEVER_IMPORTED: "–",
};

const HEALTH_LABEL: Record<HealthState, string> = {
  HEALTHY: "Gezond",
  WARNING: "Waarschuwing",
  STALE: "Verouderd",
  FAILED: "Mislukt",
  NEVER_IMPORTED: "Nooit geïmporteerd",
};

/** Never relies on color alone — always renders an icon + text label. */
export function HealthBadge({ state, className }: { state: HealthState; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        HEALTH_STYLE[state],
        className,
      )}
    >
      <span aria-hidden>{HEALTH_ICON[state]}</span>
      {HEALTH_LABEL[state]}
    </span>
  );
}
