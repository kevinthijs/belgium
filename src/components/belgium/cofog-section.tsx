import { getBelgiumCofogBreakdown } from "@/server/queries/finance";
import { getBelgiumProfile } from "@/server/queries/belgium";
import { CofogBarChart } from "./cofog-bar-chart";

export async function BelgiumCofogSection() {
  const [breakdown, profile] = await Promise.all([getBelgiumCofogBreakdown(), getBelgiumProfile()]);
  const population = profile?.population.available ? Number(profile.population.rawValue) : null;

  return (
    <section id="cofog" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Overheidsuitgaven per functie
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Uitgaven ingedeeld volgens COFOG (Classification of the Functions of Government), niveau I — bijvoorbeeld
        onderwijs, gezondheidszorg en sociale bescherming. Een verdere onderverdeling (niveau II) is nog niet voor
        elke categorie beschikbaar; die volgt zodra de brondata dit toelaat.
      </p>

      {!breakdown.available ? (
        <p className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center text-sm text-foreground-subtle">
          {breakdown.reason ?? "Geen gegevens beschikbaar."}
        </p>
      ) : (
        <div className="mt-8 rounded-md border border-border bg-surface p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-foreground-muted">Uitgaven per functie — {breakdown.year}</h3>
          </div>
          <CofogBarChart categories={breakdown.categories} population={population} />
          <p className="mt-4 text-xs text-foreground-subtle">
            Percentages tellen op tot het totaal van de vergelijkbare COFOG-categorieën voor {breakdown.year}. Een
            %-bbp-weergave per categorie is niet beschikbaar, omdat Eurostat deze reeks enkel in EUR publiceert.
          </p>
        </div>
      )}
    </section>
  );
}
