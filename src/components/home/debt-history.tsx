import Link from "next/link";
import { getMessages } from "@/i18n";
import { getDebtHistory } from "@/server/queries/homepage";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { SourceDisclosure } from "@/components/data/source-disclosure";

export async function DebtHistory() {
  const t = getMessages();
  const history = await getDebtHistory();

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
          {t.history.heading}
        </h2>
        {history.available && history.source ? <SourceDisclosure source={history.source} /> : null}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
        {history.available ? (
          <TimeSeriesChart
            data={history.points.map((p) => ({ period: p.period, value: Number(p.value), status: p.status }))}
            ariaLabel={`${t.history.debtInEuro}: ${history.points[0]?.period} tot ${history.points[history.points.length - 1]?.period}`}
          />
        ) : (
          <p className="py-16 text-center text-sm text-foreground-subtle">{t.emptyStates.noData}</p>
        )}
      </div>
      <Link href="/belgie#schuld" className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2">
        Bekijk de volledige schuldpagina →
      </Link>
    </section>
  );
}
