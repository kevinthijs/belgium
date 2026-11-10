import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getMessages } from "@/i18n";
import { getDebtHeroData } from "@/server/queries/homepage";
import { DebtCounter, DebtCounterUnavailable } from "./debt-counter";
import { formatCurrency, formatPeriod } from "@/lib/format/money";
import { DataStatusBadge } from "@/components/data/data-status-badge";
import { SourceDisclosure } from "@/components/data/source-disclosure";

export async function HomeHero() {
  const t = getMessages();
  const debtHero = await getDebtHeroData();
  return (
    <section className="mx-auto max-w-content px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pt-20">
      <div className="grid items-end gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <h1 className="max-w-3xl text-[clamp(2.1rem,4.3vw,3.75rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-foreground">{t.hero.heading}</h1>
        <div className="pb-1">
          <p className="max-w-lg text-base text-foreground-muted">{t.hero.subheading}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <a href="#overzicht" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">Verken de cijfers <ArrowDown className="h-4 w-4" aria-hidden="true" /></a>
            <Link href="/vergelijk" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">Vergelijk met Frankrijk <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
      <div className="mt-9 rounded-lg border border-border bg-surface px-5 py-6 sm:mt-12 sm:p-8 lg:p-10">
        {debtHero.available ? <DebtCounter data={debtHero} renderedAt={Date.now()} /> : <DebtCounterUnavailable reason={debtHero.reason} />}
        {debtHero.available ? (
          <dl className="mt-7 grid gap-5 border-t border-border pt-6 sm:grid-cols-3 sm:gap-8">
            {[
              { title: t.metrics.debtPerCapita, metric: debtHero.debtPerCapita },
              { title: t.metrics.debtToGdp, metric: debtHero.debtToGdp },
            ].map(({ title, metric }) => (
              <div key={title} className="min-w-0">
                <dt className="text-sm text-foreground-muted">{title}</dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums">{metric.available ? (metric.unit === "EUR_PER_CAPITA" ? formatCurrency(metric.rawValue) : metric.value) : metric.reason}</dd>
                {metric.available ? <dd className="mt-2 flex flex-wrap items-center gap-2"><DataStatusBadge status={metric.status} /><SourceDisclosure source={metric.source} /></dd> : null}
              </div>
            ))}
            <div>
              <dt className="text-sm text-foreground-muted">{t.metrics.lastObservation}</dt>
              <dd className="mt-2 text-lg font-semibold">{formatPeriod(debtHero.observationPeriod)}</dd>
              <dd className="mt-2"><DataStatusBadge status={debtHero.source.status} /></dd>
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}
