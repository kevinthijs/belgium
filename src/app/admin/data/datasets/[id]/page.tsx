import Link from "next/link";
import { notFound } from "next/navigation";
import { getDatasetDetail } from "@/server/admin/queries/datasets";
import { HealthBadge } from "@/components/admin/health-badge";
import { SummaryCard } from "@/components/admin/summary-card";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { formatDateTime, formatDuration } from "@/lib/format/datetime";
import { formatInteger } from "@/lib/format/money";
import { isManuallyTriggerable } from "@/server/admin/manual-import";
import { ManualImportControls } from "./manual-import-controls";

export const dynamic = "force-dynamic";

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getDatasetDetail(id);
  if (!detail) notFound();

  const { dataset, health, stats, importHistory, publicUsage } = detail;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-subtle">{dataset.organisation.name}</p>
          <h1 className="text-xl font-semibold text-foreground">{dataset.name}</h1>
          <p className="mt-1 font-mono text-sm text-foreground-muted">{dataset.code}</p>
        </div>
        <HealthBadge state={health.state} />
      </div>

      {health.reasons.length > 0 ? (
        <ul className="mt-3 space-y-1 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground-muted">
          {health.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Field label="Beschrijving">{dataset.description ?? "—"}</Field>
        <Field label="Frequentie">{dataset.frequency}</Field>
        <Field label="Boekhoudkundig raamwerk">{dataset.accountingFramework?.name ?? "—"}</Field>
        <Field label="Ingeschakeld">{dataset.isEnabled ? "Ja" : "Nee"}</Field>
        <Field label="Laatste periode">{dataset.latestAvailablePeriod ?? "—"}</Field>
        <Field label="Eerste periode">{dataset.firstAvailablePeriod ?? "—"}</Field>
        <Field label="Laatst gecontroleerd">{formatDateTime(dataset.lastCheckedAt)}</Field>
        <Field label="Laatst gewijzigd">{formatDateTime(dataset.lastChangedAt)}</Field>
        <Field label="Licentie">{dataset.licence ?? "—"}</Field>
        <Field label="Bronpagina">
          {dataset.landingPageUrl ? (
            <a href={dataset.landingPageUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              {dataset.landingPageUrl}
            </a>
          ) : (
            "—"
          )}
        </Field>
        <Field label="API URL">
          {dataset.apiUrl ? (
            <a href={dataset.apiUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              {dataset.apiUrl}
            </a>
          ) : (
            "—"
          )}
        </Field>
      </dl>

      {isManuallyTriggerable(dataset.code) ? <ManualImportControls datasetId={dataset.id} /> : null}

      <h2 className="mt-8 text-base font-semibold text-foreground">Statistieken</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <SummaryCard label="Observaties" value={formatInteger(stats.observationCount)} />
        <SummaryCard label="Entiteiten" value={formatInteger(stats.entityCount)} />
        <SummaryCard label="Metrics" value={formatInteger(stats.metricCount)} />
        <SummaryCard label="Periodes" value={formatInteger(stats.periodCount)} />
        <SummaryCard label="Classificaties" value={formatInteger(stats.classificationCount)} />
        <SummaryCard label="Revisies" value={formatInteger(stats.revisionCount)} />
        <SummaryCard label="Ongemapt (open)" value={formatInteger(stats.unmappedCount)} />
        <SummaryCard label="Afgewezen (totaal)" value={formatInteger(stats.rejectedCount)} />
      </div>

      <h2 className="mt-8 text-base font-semibold text-foreground">Waar wordt deze dataset gebruikt?</h2>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        {publicUsage.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            Geen bekende publieke afhankelijkheden geconfigureerd voor <span className="font-mono">{dataset.code}</span>.
          </p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
            {publicUsage.map((usage) => (
              <li key={usage}>{usage}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Importgeschiedenis</h2>
        <Link href={`/admin/data/imports?datasetId=${dataset.id}`} className="text-sm text-accent hover:underline">
          Alle imports →
        </Link>
      </div>
      <div className="mt-3">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Gestart</AdminTh>
            <AdminTh>Duur</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Ontvangen</AdminTh>
            <AdminTh className="text-right">Aangemaakt</AdminTh>
            <AdminTh className="text-right">Bijgewerkt</AdminTh>
            <AdminTh className="text-right">Ongewijzigd</AdminTh>
            <AdminTh className="text-right">Afgewezen</AdminTh>
          </AdminTableHead>
          <tbody>
            {importHistory.length === 0 ? (
              <AdminEmptyRow colSpan={8}>Nog geen importruns.</AdminEmptyRow>
            ) : (
              importHistory.map((run) => (
                <AdminRow key={run.id}>
                  <AdminTd>
                    <Link href={`/admin/data/imports/${run.id}`} className="text-accent hover:underline">
                      {formatDateTime(run.startedAt)}
                    </Link>
                  </AdminTd>
                  <AdminTd>{run.completedAt ? formatDuration(run.completedAt.getTime() - run.startedAt.getTime()) : "—"}</AdminTd>
                  <AdminTd>{run.status}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsReceived)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsCreated)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsUpdated)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsUnchanged)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsRejected)}</AdminTd>
                </AdminRow>
              ))
            )}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">{label}</dt>
      <dd className="mt-0.5 text-foreground">{children}</dd>
    </div>
  );
}
