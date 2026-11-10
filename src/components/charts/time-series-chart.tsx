"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { formatCompactCurrency, formatPeriod } from "@/lib/format/money";

export interface TimeSeriesPoint {
  period: string;
  value: number;
  status: string;
}

export function TimeSeriesChart({
  data,
  ariaLabel,
  valueFormatter = formatCompactCurrency,
  showZeroLine = false,
}: {
  data: TimeSeriesPoint[];
  ariaLabel: string;
  valueFormatter?: (value: number) => string;
  showZeroLine?: boolean;
}) {
  if (data.length === 0) return null;

  return (
    <div role="img" aria-label={ariaLabel} className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: "var(--foreground-subtle)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--foreground-subtle)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => valueFormatter(v)}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => valueFormatter(value)}
            labelFormatter={(label: string) => formatPeriod(label)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {showZeroLine ? <ReferenceLine y={0} stroke="var(--foreground-subtle)" strokeDasharray="3 3" /> : null}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--data-series-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
