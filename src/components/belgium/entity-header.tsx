import { getBelgiumProfile } from "@/server/queries/belgium";

export async function GovernmentEntityHeader() {
  const profile = await getBelgiumProfile();

  if (!profile) {
    return (
      <section className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-foreground-subtle">Overheid niet gevonden.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-content px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <p className="text-sm font-medium uppercase tracking-wide text-foreground-subtle">Financieel dossier</p>
      <h1 className="mt-1 text-[clamp(2rem,4vw,2.75rem)] font-semibold tracking-tight text-foreground">
        {profile.officialName ?? profile.name}
      </h1>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-foreground-muted">
        {profile.sectorCode ? (
          <div className="flex gap-1.5">
            <dt className="text-foreground-subtle">Statistische sector:</dt>
            <dd>
              {profile.sectorCode}
              {profile.sectorName ? ` — ${profile.sectorName}` : ""}
            </dd>
          </div>
        ) : null}
        {profile.population.available ? (
          <div className="flex gap-1.5">
            <dt className="text-foreground-subtle">Bevolking:</dt>
            <dd>
              {profile.population.value} ({profile.population.period})
            </dd>
          </div>
        ) : null}
        {profile.latestFinancialYear ? (
          <div className="flex gap-1.5">
            <dt className="text-foreground-subtle">Laatste volledig begrotingsjaar:</dt>
            <dd>{profile.latestFinancialYear}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 max-w-2xl text-foreground-muted">
        Een overzicht van de Belgische overheidsschuld, inkomsten, uitgaven, begrotingssaldo en belastingen op basis
        van officiële gegevens van Eurostat en Statbel. Elke waarde toont zijn periode, status en bron.
      </p>
    </section>
  );
}
