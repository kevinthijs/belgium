import { cn } from "@/lib/utils";
import { STATUS_LABEL_TEXT } from "@/server/queries/status-labels";
import type { DataStatusDisplay } from "@/server/queries/types";

const STATUS_STYLE: Record<DataStatusDisplay, string> = {
  DEFINITIEF: "border-[color:var(--status-final)]/40 text-[color:var(--status-final)]",
  VOORLOPIG: "border-[color:var(--status-provisional)]/40 text-[color:var(--status-provisional)]",
  BEGROTING: "border-border text-foreground-muted",
  AANGEPASTE_BEGROTING: "border-border text-foreground-muted",
  RAMING: "border-[color:var(--status-estimated)]/40 text-[color:var(--status-estimated)]",
  PROGNOSE: "border-[color:var(--status-estimated)]/40 text-[color:var(--status-estimated)]",
};

/** Always renders as text + border, never relies on color alone. */
export function DataStatusBadge({ status, className }: { status: DataStatusDisplay; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL_TEXT[status]}
    </span>
  );
}
