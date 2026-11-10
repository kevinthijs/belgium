import Decimal from "decimal.js";
import { getBelgiumDebtHistoryAllUnits, getBelgiumKeyMetrics } from "@/server/queries/belgium";
import { MetricCard } from "@/components/data/metric-card";
import { SourceDisclosure } from "@/components/data/source-disclosure";
import { FinancialMetricHistory } from "./financial-metric-history";
import { formatCompactCurrency, formatPeriod } from "@/lib/format/money";

export async function BelgiumDebtSection() {
  const [metrics, history] = await Promise.all([getBelgiumKeyMetrics(), getBelgiumDebtHistoryAllUnits()]);

  const first = history.points[0];
  const last = history.points[history.points.length - 1];
  let deltaText: string | null = null;
  if (first && last && first.period !== last.period) {
    const delta = new Decimal(last.eur).minus(first.eur);
    const direction = delta.gte(0) ? "toegenomen" : "afgenomen";
    deltaText = `Tussen ${formatPeriod(first.period)} en ${formatPeriod(last.period)} is de geregistreerde overheidsschuld ${direction} met ${formatCompactCurrency(delta.abs())}, van ${formatCompactCurrency(first.eur)} naar ${formatCompactCurrency(last.eur)}.`;
  }

  return (
    <section id="schuld" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Overheidsschuld
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        De Belgische overheidsschuld (Maastricht-definitie) is de geconsolideerde brutoschuld van de volledige
        overheid (sector S13: federale overheid, deelstaten, lokale besturen en sociale zekerheid), gerapporteerd
        volgens ESA 2010 aan Eurostat.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard title="Overheidsschuld (officieel)" metric={metrics.officialDebt} />
        <MetricCard title="Schuld t.o.v. bbp" metric={metrics.debtToGdp} />
        <MetricCard title="Schuld per inwoner" metric={metrics.debtPerCapita} />
      </div>

      {history.available ? (
        <div className="mt-8 rounded-md border border-border bg-surface p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-foreground-muted">Historische evolutie van de schuld</h3>
            {history.source ? <SourceDisclosure source={history.source} /> : null}
          </div>
          <FinancialMetricHistory
            data={history.points.map((p) => ({
              period: p.period,
              year: p.year,
              eur: p.eur,
              pctGdp: p.pctGdp,
              perCapita: p.perCapita,
              status: p.status,
            }))}
            ariaLabel="Evolutie van de Belgische overheidsschuld"
          />
          {deltaText ? <p className="mt-4 text-sm text-foreground-muted">{deltaText}</p> : null}
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center text-sm text-foreground-subtle">
          Geen gegevens beschikbaar.
        </p>
      )}

      <p className="mt-6 max-w-2xl text-sm text-foreground-subtle">
        Meer over de Maastricht-definitie, ESA 2010 en consolidatie:{" "}
        <a href="#bronnen" className="underline underline-offset-2">
          zie methodologie hieronder
        </a>
        .
      </p>
    </section>
  );
}
