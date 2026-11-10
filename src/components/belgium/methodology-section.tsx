export function MethodologySection() {
  return (
    <section id="bronnen" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Over deze cijfers
      </h2>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">Sector S13 — overheid</h3>
          <p className="mt-1.5 text-sm text-foreground-muted">
            De statistische hoofdreeksen op deze pagina hebben betrekking op de consolidatie van de volledige Belgische overheid,
            statistische sector S13 in het Europees systeem van rekeningen (ESA 2010): de federale overheid, de
            deelstaten (gemeenschappen en gewesten), de lokale besturen en de sociale zekerheid samen.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">ESA 2010</h3>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Het Europees systeem van rekeningen (ESA 2010) is de gemeenschappelijke boekhoudkundige standaard die
            alle EU-lidstaten gebruiken om hun overheidsfinanciën te rapporteren aan Eurostat, wat internationale
            vergelijkingen mogelijk maakt.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Maastrichtschuld</h3>
          <p className="mt-1.5 text-sm text-foreground-muted">
            De overheidsschuld die hier wordt getoond, is de geconsolideerde brutoschuld volgens de
            Maastricht-definitie: nominale waarde, na consolidatie van schulden tussen overheidsonderdelen
            onderling, gebruikt voor de Europese begrotingsregels.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Consolidatie</h3>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Vorderingen en schulden tussen overheidsonderdelen onderling (bv. tussen de federale overheid en een
            gewest) worden tegen elkaar weggestreept, zodat de totale overheidsschuld niet dubbel wordt geteld.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Bevolkingsreferentiedatum</h3>
          <p className="mt-1.5 text-sm text-foreground-muted">
            De bevolkingscijfers van Statbel zijn een momentopname op 1 januari van elk jaar (wettelijke bevolking).
            Per-inwonerberekeningen gebruiken de bevolking van het jaar dat overeenkomt met de financiële periode.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Officieel versus geraamd</h3>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Officiële cijfers komen rechtstreeks uit de brondatasets van Eurostat of Statbel. Geraamde cijfers (bv.
            de actuele schuldteller op de homepagina) worden apart als &quot;raming&quot; gelabeld en vervangen nooit het
            laatst gerapporteerde officiële cijfer — beide worden steeds afzonderlijk getoond.
          </p>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <h3 className="text-sm font-medium text-foreground">Onderwijs, partijen en NAVO</h3>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Het aanvullende referentieoverzicht gebruikt een vast gemeenschappelijk jaar. Onderwijs en defensie
          komen uit Eurostat; partijfinanciering komt uit een gepubliceerde analyse van de partijrekeningen.
          De NAVO-bijdrage is een indicatieve berekening met budgetten en een verdeelsleutel, geen vastgestelde
          betaling. Bronlinks, afbakening, status en controledatum staan bij dit overzicht.
        </p>
      </div>

      <p className="mt-8 max-w-2xl text-sm text-foreground-subtle">
        De statistische kaarten en grafieken tonen bij het bronicoon de organisatie, dataset, periode, sector,
        eenheid, kader en status van de onderliggende data, inclusief de datum waarop deze werd opgehaald.
      </p>
    </section>
  );
}
