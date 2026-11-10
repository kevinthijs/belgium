"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactCurrency, formatPercentage, formatPerCapita } from "@/lib/format/money";

export interface BarChartPoint {
  label: string;
  value: number;
  highlighted?: boolean;
}

/**
 * `format` is a serializable string (not a function) so this prop can be set
 * from a server component — functions cannot cross the server/client
 * boundary as props. Client-component callers that already hold a formatter
 * function may pass `valueFormatter` directly instead.
 */
export type BarChartFormat = "currency" | "percentage" | "perCapita";

const FORMATTERS: Record<BarChartFormat, (value: number) => string> = {
  currency: formatCompactCurrency,
  percentage: formatPercentage,
  perCapita: formatPerCapita,
};

export function HorizontalBarChart({
  data,
  ariaLabel,
  format = "currency",
  valueFormatter,
}: {
  data: BarChartPoint[];
  ariaLabel: string;
  format?: BarChartFormat;
  valueFormatter?: (value: number) => string;
}) {
  if (data.length === 0) return null;
  const resolvedFormatter = valueFormatter ?? FORMATTERS[format];
  const height = Math.max(180, data.length * 40);

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--foreground-subtle)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(v: number) => resolvedFormatter(v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--foreground-muted)" }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            formatter={(value: number) => resolvedFormatter(value)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.highlighted ? "var(--accent)" : "var(--data-series-2)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
