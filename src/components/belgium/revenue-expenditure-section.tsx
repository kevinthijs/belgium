import { getBelgiumRevenueHistory, getBelgiumExpenditureHistory, getBelgiumBalanceHistory } from "@/server/queries/finance";
import { getBelgiumKeyMetrics } from "@/server/queries/belgium";
import { MetricCard } from "@/components/data/metric-card";
import { SourceDisclosure } from "@/components/data/source-disclosure";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { formatCompactCurrency } from "@/lib/format/money";

export async function RevenueExpenditureSection() {
  const [metrics, revenue, expenditure, balance] = await Promise.all([
    getBelgiumKeyMetrics(),
    getBelgiumRevenueHistory(),
    getBelgiumExpenditureHistory(),
    getBelgiumBalanceHistory(),
  ]);

  const byYear = new Map<number, { revenue?: string; expenditure?: string; balance?: string }>();
  for (const p of revenue.points) byYear.set(p.year, { ...byYear.get(p.year), revenue: p.value });
  for (const p of expenditure.points) byYear.set(p.year, { ...byYear.get(p.year), expenditure: p.value });
  for (const p of balance.points) byYear.set(p.year, { ...byYear.get(p.year), balance: p.value });
  const years = [...byYear.keys()].sort((a, b) => b - a);

  const revenueSeries = revenue.points.map((p) => ({ period: String(p.year), value: Number(p.value), status: p.status }));
  const expenditureSeries = expenditure.points.map((p) => ({ period: String(p.year), value: Number(p.value), status: p.status }));

  return (
    <>
      <section id="inkomsten" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
          Inkomsten en uitgaven
        </h2>
        <p className="mt-2 max-w-2xl text-foreground-muted">
          Totale ontvangsten en uitgaven van de gehele Belgische overheid (S13), jaarlijks gerapporteerd volgens ESA
          2010.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <MetricCard title="Overheidsinkomsten" metric={metrics.revenue} />
          <MetricCard title="Overheidsuitgaven" metric={metrics.expenditure} />
        </div>

        {revenue.available && expenditure.available ? (
          <div id="uitgaven" className="mt-8 scroll-mt-16 rounded-md border border-border bg-surface p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-foreground-muted">Inkomsten vs. uitgaven, per jaar</h3>
              {revenue.source ? <SourceDisclosure source={revenue.source} /> : null}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">Inkomsten</p>
                <TimeSeriesChart data={revenueSeries} ariaLabel="Overheidsinkomsten per jaar" />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">Uitgaven</p>
                <TimeSeriesChart data={expenditureSeries} ariaLabel="Overheidsuitgaven per jaar" />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-subtle">
                    <th className="py-2 pr-4 font-medium">Jaar</th>
                    <th className="py-2 pr-4 font-medium">Inkomsten</th>
                    <th className="py-2 pr-4 font-medium">Uitgaven</th>
                    <th className="py-2 pr-4 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((year) => {
                    const row = byYear.get(year)!;
                    return (
                      <tr key={year} className="border-b border-border/60">
                        <td className="py-1.5 pr-4 tabular-nums">{year}</td>
                        <td className="py-1.5 pr-4 tabular-nums">
                          {row.revenue ? formatCompactCurrency(row.revenue) : "Geen gegevens beschikbaar"}
                        </td>
                        <td className="py-1.5 pr-4 tabular-nums">
                          {row.expenditure ? formatCompactCurrency(row.expenditure) : "Geen gegevens beschikbaar"}
                        </td>
                        <td className="py-1.5 pr-4 tabular-nums">
                          {row.balance ? formatCompactCurrency(row.balance) : "Geen gegevens beschikbaar"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center text-sm text-foreground-subtle">
            Geen gegevens beschikbaar.
          </p>
        )}
      </section>
    </>
  );
}
