import Link from "next/link";
import { getMessages } from "@/i18n";
import { getBelgiumCofogBreakdown } from "@/server/queries/finance";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";

export async function CofogBreakdown() {
  const t = getMessages();
  const breakdown = await getBelgiumCofogBreakdown();

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        {t.cofog.heading}
      </h2>
      <p className="mt-2 max-w-xl text-foreground-muted">
        {breakdown.available ? `${t.cofog.subheading} (${breakdown.year})` : t.cofog.subheading}
      </p>

      {!breakdown.available ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center">
          <p className="text-sm text-foreground-subtle">{breakdown.reason ?? t.cofog.unavailable}</p>
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-border bg-surface p-5 sm:p-6">
          <HorizontalBarChart
            ariaLabel={t.cofog.heading}
            data={breakdown.categories.map((c, i) => ({
              label: c.label,
              value: Number(c.valueEUR),
              highlighted: i === 0,
            }))}
          />
        </div>
      )}
      <Link href="/belgie#cofog" className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2">
        Bekijk alle uitgaven per functie →
      </Link>
      <p className="mt-3 text-sm">
        <Link href="/belgie#bestedingen" className="font-medium text-accent underline underline-offset-2">
          Hoeveel gaat naar onderwijs, politieke partijen en de NAVO? →
        </Link>
      </p>
    </section>
  );
}
