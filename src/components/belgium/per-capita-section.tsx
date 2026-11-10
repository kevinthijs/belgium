import { getBelgiumPerCapitaMetrics } from "@/server/queries/belgium";
import { MetricCard } from "@/components/data/metric-card";

export async function PerCapitaFinanceSection() {
  const metrics = await getBelgiumPerCapitaMetrics();

  return (
    <section id="per-inwoner" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Overheidsfinanciën per inwoner
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Overheidsschuld, -inkomsten, -uitgaven en -saldo omgerekend per inwoner, op basis van de officiële
        bevolkingscijfers van Statbel. Dit is een rekenkundige omrekening, geen individuele schuld of claim per
        persoon.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Schuld per inwoner" metric={metrics.debtPerCapita} />
        <MetricCard title="Inkomsten per inwoner" metric={metrics.revenuePerCapita} />
        <MetricCard title="Uitgaven per inwoner" metric={metrics.expenditurePerCapita} />
        <MetricCard title="Saldo per inwoner" metric={metrics.balancePerCapita} />
      </div>
    </section>
  );
}
