import { getBelgiumKeyMetrics } from "@/server/queries/belgium";
import { MetricCard } from "@/components/data/metric-card";

export async function BelgiumKeyMetrics() {
  const metrics = await getBelgiumKeyMetrics();

  return (
    <section className="mx-auto max-w-content px-4 pb-16 sm:px-6 lg:px-8">
      <p className="mb-4 text-sm text-foreground-subtle">
        Schuldcijfers zijn per kwartaal, inkomsten/uitgaven/saldo per jaar — elke kaart toont zijn eigen periode zodat
        cijfers nooit stilzwijgend uit verschillende periodes worden gemengd.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Overheidsschuld (officieel)" metric={metrics.officialDebt} />
        <MetricCard title="Schuld t.o.v. bbp" metric={metrics.debtToGdp} />
        <MetricCard title="Schuld per inwoner" metric={metrics.debtPerCapita} />
        <MetricCard title="Overheidsinkomsten" metric={metrics.revenue} />
        <MetricCard title="Overheidsuitgaven" metric={metrics.expenditure} />
        <MetricCard title="Begrotingssaldo" metric={metrics.balance} />
      </div>
    </section>
  );
}
