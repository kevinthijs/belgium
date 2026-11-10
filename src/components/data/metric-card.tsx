import { Card, CardFooter, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { DataStatusBadge } from "./data-status-badge";
import { SourceDisclosure } from "./source-disclosure";
import type { MetricResult } from "@/server/queries/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/format/money";

export function MetricCard({ title, metric, compact = false }: { title: string; metric: MetricResult; compact?: boolean }) {
  if (!metric.available) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <p className="text-sm text-foreground-subtle">{metric.reason}</p>
      </Card>
    );
  }

  const displayValue = compact && metric.unit.includes("EUR")
    ? metric.unit === "EUR_PER_CAPITA" ? formatCurrency(metric.rawValue) : formatCompactCurrency(metric.rawValue)
    : metric.value;
  const suffix = compact ? / (miljard|miljoen|duizend)$/.exec(displayValue)?.[1] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <DataStatusBadge status={metric.status} />
      </CardHeader>
      <CardValue title={metric.value} className="break-words">{suffix ? displayValue.slice(0, -(suffix.length + 1)) : displayValue}</CardValue>
      {suffix ? <p className="mt-1 text-sm text-foreground-muted">{suffix} euro</p> : null}
      <CardFooter>
        <span className="text-xs text-foreground-subtle">{metric.period}</span>
        <SourceDisclosure source={metric.source} />
      </CardFooter>
    </Card>
  );
}
