import {
  getGovernmentSectorOverview,
  getGovernmentSectorDebtContributions,
  getGovernmentSectorDebtContributionHistory,
  GOVERNMENT_SUBSECTORS,
} from "@/server/queries/government-sectors";
import { MetricCard } from "@/components/data/metric-card";
import { SourceDisclosure } from "@/components/data/source-disclosure";
import { HorizontalBarChart, type BarChartPoint } from "@/components/charts/horizontal-bar-chart";
import { DebtContributionHistoryChart, type DebtContributionHistorySeries } from "./debt-contribution-history-chart";

export async function GovernmentSectorsSection() {
  const [overview, debtContributions, debtHistories] = await Promise.all([
    getGovernmentSectorOverview(),
    getGovernmentSectorDebtContributions(),
    Promise.all(GOVERNMENT_SUBSECTORS.map((s) => getGovernmentSectorDebtContributionHistory(s.slug))),
  ]);

  const debtBarData: BarChartPoint[] = debtContributions.available
    ? debtContributions.rows
        .filter((row) => row.contribution.available)
        .map((row) => ({
          label: row.label,
          value: Number(row.contribution.available ? row.contribution.rawValue : 0),
        }))
    : [];

  const debtHistorySeries: DebtContributionHistorySeries[] = GOVERNMENT_SUBSECTORS.map((s, i) => ({
    slug: s.slug,
    label: s.label,
    points: (debtHistories[i]?.points ?? []).map((p) => ({ period: p.period, value: p.valueEUR })),
  })).filter((s) => s.points.length > 0);

  return (
    <section id="overheidsniveaus" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Wie ontvangt en geeft het overheidsgeld uit?
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        De Belgische overheid (S13) bestaat uit vier deelsectoren: de federale overheid, de gemeenschappen en
        gewesten, de lokale overheden en de sociale zekerheid. Cijfers per deelsector, op basis van de Nationale Bank
        van België.
      </p>

      {overview.available ? (
        <>
          <p
            role="note"
            className="mt-6 max-w-2xl rounded-md border border-dashed border-border bg-surface-muted p-4 text-sm text-foreground-muted"
          >
            {overview.consolidationWarning}
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-sm text-foreground-subtle">Cijfers voor {overview.period}</span>
            {overview.source ? <SourceDisclosure source={overview.source} /> : null}
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {overview.rows.map((row) => {
              const debtRow = debtContributions.available
                ? debtContributions.rows.find((r) => r.slug === row.slug)
                : undefined;
              return (
                <div key={row.slug} className="rounded-md border border-border bg-surface p-5 sm:p-6">
                  <h3 className="text-sm font-medium text-foreground-muted">
                    {row.label} <span className="text-foreground-subtle">({row.sectorCode})</span>
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard title="Inkomsten" metric={row.revenue} />
                    <MetricCard title="Uitgaven" metric={row.expenditure} />
                    <MetricCard title="Saldo" metric={row.balance} />
                    {debtRow ? <MetricCard title="Bijdrage aan schuld" metric={debtRow.contribution} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center text-sm text-foreground-subtle">
          Geen gegevens beschikbaar.
        </p>
      )}

      {debtContributions.available ? (
        <div className="mt-12 border-t border-border pt-12">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Bijdrage aan de overheidsschuld</h3>
          <p className="mt-2 max-w-2xl text-sm text-foreground-muted" title={debtContributions.methodologyNote}>
            {debtContributions.methodologyNote}{" "}
            <span aria-hidden className="text-foreground-subtle">
              ⓘ
            </span>
          </p>
          <p
            role="note"
            className="mt-4 max-w-2xl rounded-md border border-dashed border-border bg-surface-muted p-4 text-sm text-foreground-muted"
          >
            {debtContributions.consolidationWarning}
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-sm text-foreground-subtle">Cijfers voor {debtContributions.period}</span>
            {debtContributions.source ? <SourceDisclosure source={debtContributions.source} /> : null}
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-surface p-5 sm:p-6">
              <HorizontalBarChart data={debtBarData} ariaLabel="Bijdrage per deelsector aan de overheidsschuld" format="currency" />
            </div>
            {debtContributions.totalConsolidatedGrossDebt ? (
              <div className="rounded-md border border-border bg-surface p-5 sm:p-6">
                <MetricCard title="Totale geconsolideerde overheidsschuld (S13)" metric={debtContributions.totalConsolidatedGrossDebt} />
              </div>
            ) : null}
          </div>

          {debtHistorySeries.length > 0 ? (
            <div className="mt-6 rounded-md border border-border bg-surface p-5 sm:p-6">
              <h4 className="text-sm font-medium text-foreground-muted">Historische evolutie per deelsector</h4>
              <div className="mt-4">
                <DebtContributionHistoryChart series={debtHistorySeries} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
