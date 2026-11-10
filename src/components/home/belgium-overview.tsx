import Link from "next/link";
import { getMessages } from "@/i18n";
import { getBelgiumOverview } from "@/server/queries/homepage";
import { MetricCard } from "@/components/data/metric-card";

export async function BelgiumOverview() {
  const t = getMessages();
  const overview = await getBelgiumOverview();

  const balanceLabel =
    overview.balanceIsDeficit === true
      ? `${t.overview.balance} (tekort)`
      : overview.balanceIsDeficit === false
        ? `${t.overview.balance} (overschot)`
        : t.overview.balance;

  return (
    <section id="overzicht" aria-label="Financieel overzicht" className="mx-auto max-w-content scroll-mt-32 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        {overview.year ? `${t.overview.heading} — realisatie ${overview.year}` : t.overview.heading}
      </h2>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact title={t.overview.revenue} metric={overview.revenue} />
        <MetricCard compact title={t.overview.expenditure} metric={overview.expenditure} />
        <MetricCard compact title={balanceLabel} metric={overview.balance} />
        <MetricCard compact title={t.overview.expenditurePerCapita} metric={overview.expenditurePerCapita} />
      </div>
      <Link href="/belgie#inkomsten" className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2">
        Bekijk het volledige financiële dossier →
      </Link>
    </section>
  );
}
