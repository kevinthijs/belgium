import { getBelgiumTaxBreakdown } from "@/server/queries/belgium";
import { getHundredEuroRevenue } from "@/server/queries/finance";
import { SourceDisclosure } from "@/components/data/source-disclosure";
import { formatCompactCurrency } from "@/lib/format/money";

export async function BelgiumTaxSection() {
  const [breakdown, hundredEuro] = await Promise.all([getBelgiumTaxBreakdown(), getHundredEuroRevenue()]);

  return (
    <section id="belastingen" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">Belastingen</h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Belastingontvangsten van de gehele Belgische overheid, ingedeeld volgens de officiële Eurostat-classificatie
        (gov_10a_taxag). Deze indeling volgt de officiële Eurostat-classificatie en bevat geen categorieën waarvoor
        geen brondata bestaat.
      </p>

      {!breakdown.available ? (
        <p className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center text-sm text-foreground-subtle">
          {breakdown.reason ?? "Geen gegevens beschikbaar."}
        </p>
      ) : (
        <div className="mt-8 rounded-md border border-border bg-surface p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-foreground-muted">Belastingcategorieën — {breakdown.year}</h3>
            {breakdown.source ? <SourceDisclosure source={breakdown.source} /> : null}
          </div>
          <ul className="space-y-2">
            {breakdown.categories.map((c) => (
              <li key={c.metricCode} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{c.label}</span>
                <span className="tabular-nums text-foreground">
                  {formatCompactCurrency(c.valueEUR)}{" "}
                  <span className="text-foreground-subtle">({c.shareOfTotalTax}%)</span>
                </span>
              </li>
            ))}
          </ul>
          {breakdown.subcategories.length > 0 ? (
            <>
              <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Waarvan (detail, indien beschikbaar)
              </p>
              <ul className="space-y-2">
                {breakdown.subcategories.map((c) => (
                  <li key={c.metricCode} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground-muted">{c.label}</span>
                    <span className="tabular-nums text-foreground-muted">
                      {formatCompactCurrency(c.valueEUR)}{" "}
                      <span className="text-foreground-subtle">({c.shareOfTotalTax}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      )}

      {hundredEuro.available ? (
        <div className="mt-6 rounded-md border border-border bg-surface p-5 sm:p-6">
          <h3 className="text-sm font-medium text-foreground-muted">Per €100 ontvangsten — {hundredEuro.year}</h3>
          <ul className="mt-4 space-y-2">
            {hundredEuro.categories.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{c.label}</span>
                <span className="tabular-nums font-medium text-foreground">{c.amountPer100}</span>
              </li>
            ))}
          </ul>
          {hundredEuro.residualNote ? (
            <p className="mt-4 text-xs text-foreground-subtle">{hundredEuro.residualNote}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
