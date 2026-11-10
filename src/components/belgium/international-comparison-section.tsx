import { getInternationalComparison } from "@/server/queries/homepage";
import { getBelgiumInternationalComparison } from "@/server/queries/belgium";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { SourceDisclosure } from "@/components/data/source-disclosure";

export async function BelgiumInternationalComparison() {
  const [debtComparison, ratioComparison] = await Promise.all([
    getInternationalComparison(),
    getBelgiumInternationalComparison(),
  ]);

  return (
    <section id="vergelijk" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Overheidsschuld vergelijken
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Vergelijking van de Belgische overheidsschuld met Nederland, Frankrijk, Duitsland en het EU27-gemiddelde,
        voor dezelfde gerapporteerde periode. Dit is een weergave voor leesbaarheid, geen rangschikking van &quot;goed&quot;
        of &quot;slecht&quot;.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-foreground-muted">Overheidsschuld (EUR)</h3>
            {debtComparison.available && debtComparison.source ? <SourceDisclosure source={debtComparison.source} /> : null}
          </div>
          {debtComparison.available ? (
            <HorizontalBarChart
              data={debtComparison.points.map((p) => ({ label: p.entityName, value: Number(p.value), highlighted: p.isHighlighted }))}
              ariaLabel="Overheidsschuld per land (EUR)"
            />
          ) : (
            <p className="py-16 text-center text-sm text-foreground-subtle">Geen gegevens beschikbaar.</p>
          )}
        </div>

        <div className="rounded-md border border-border bg-surface p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-foreground-muted">Overheidsschuld t.o.v. bbp</h3>
            {ratioComparison.available && ratioComparison.source ? <SourceDisclosure source={ratioComparison.source} /> : null}
          </div>
          {ratioComparison.available ? (
            <HorizontalBarChart
              data={ratioComparison.rows.flatMap((r) =>
                r.debtToGdp.available
                  ? [{ label: r.entityName, value: Number(r.debtToGdp.rawValue), highlighted: r.isHighlighted }]
                  : [],
              )}
              ariaLabel="Overheidsschuld t.o.v. bbp per land"
              format="percentage"
            />
          ) : (
            <p className="py-16 text-center text-sm text-foreground-subtle">Geen gegevens beschikbaar.</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-foreground-subtle">
        Vergelijk belastingen, overheidspersoneel, inkomsten, uitgaven en begrotingssaldo met Frankrijk,
        Spanje en Nederland in de <a href="#landenvergelijking" className="text-accent underline underline-offset-2">landenvergelijking</a>.
        Die gebruikt een afzonderlijk, gecontroleerd referentieoverzicht met een eigen jaartal per indicator.
      </p>
    </section>
  );
}
