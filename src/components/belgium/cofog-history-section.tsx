import { getBelgiumCofogHistory } from "@/server/queries/finance";
import { CofogHistoryChart } from "./cofog-history-chart";

export async function CofogHistorySection() {
  const history = await getBelgiumCofogHistory();

  return (
    <section id="historiek" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Historische evolutie per uitgavenfunctie
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Bekijk hoe de uitgaven binnen één COFOG-functie doorheen de tijd zijn geëvolueerd.
      </p>

      {!history.available || history.series.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center text-sm text-foreground-subtle">
          Geen gegevens beschikbaar.
        </p>
      ) : (
        <div className="mt-8 rounded-md border border-border bg-surface p-5 sm:p-6">
          <CofogHistoryChart series={history.series} />
        </div>
      )}
    </section>
  );
}
