import { getMessages } from "@/i18n";
import { getInternationalComparison } from "@/server/queries/homepage";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { SourceDisclosure } from "@/components/data/source-disclosure";
import Link from "next/link";

export async function InternationalComparison() {
  const t = getMessages();
  const comparison = await getInternationalComparison();

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
            Overheidsschuld in Europees perspectief
          </h2>
          {comparison.available ? (
            <p className="mt-1 text-sm text-foreground-muted">{comparison.metricLabel}</p>
          ) : null}
        </div>
        {comparison.available && comparison.source ? <SourceDisclosure source={comparison.source} /> : null}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
        {comparison.available ? (
          <HorizontalBarChart
            data={comparison.points.map((p) => ({
              label: p.entityName,
              value: Number(p.value),
              highlighted: p.isHighlighted,
            }))}
            ariaLabel={comparison.metricLabel}
          />
        ) : (
          <p className="py-16 text-center text-sm text-foreground-subtle">{t.emptyStates.noData}</p>
        )}
      </div>

      <Link
        href="/vergelijk"
        className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2"
      >
        {t.comparison.cta} →
      </Link>
    </section>
  );
}
