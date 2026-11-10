import { getBelgiumBalanceHistory } from "@/server/queries/finance";
import { getBelgiumKeyMetrics } from "@/server/queries/belgium";
import { MetricCard } from "@/components/data/metric-card";
import { SourceDisclosure } from "@/components/data/source-disclosure";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";

export async function GovernmentBalanceSection() {
  const [metrics, balance] = await Promise.all([getBelgiumKeyMetrics(), getBelgiumBalanceHistory()]);

  const label = metrics.balanceIsDeficit === true ? "Tekort" : metrics.balanceIsDeficit === false ? "Overschot" : null;

  const series = balance.points.map((p) => ({ period: String(p.year), value: Number(p.value), status: p.status }));

  return (
    <section id="saldo" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Begrotingssaldo
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Het verschil tussen overheidsinkomsten en -uitgaven (nettovorderingen/-behoeften, ESA 2010 B.9). Een negatief
        saldo wordt een tekort genoemd, een positief saldo een overschot — beide worden hier neutraal weergegeven,
        zonder waardeoordeel.
      </p>

      <div className="mt-6 grid gap-4 sm:max-w-sm">
        <MetricCard title={label ? `Begrotingssaldo (${label})` : "Begrotingssaldo"} metric={metrics.balance} />
      </div>

      {balance.available ? (
        <div className="mt-8 rounded-md border border-border bg-surface p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-foreground-muted">Saldo per jaar</h3>
            {balance.source ? <SourceDisclosure source={balance.source} /> : null}
          </div>
          <TimeSeriesChart data={series} ariaLabel="Belgisch begrotingssaldo per jaar" showZeroLine />
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center text-sm text-foreground-subtle">
          Geen gegevens beschikbaar.
        </p>
      )}
    </section>
  );
}
