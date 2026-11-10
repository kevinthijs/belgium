import Link from "next/link";
import { notFound } from "next/navigation";
import { getImportRunDetail } from "@/server/admin/queries/imports";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { formatDateTime, formatDuration } from "@/lib/format/datetime";
import { formatInteger } from "@/lib/format/money";

export const dynamic = "force-dynamic";

export default async function ImportRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getImportRunDetail(id);
  if (!run) notFound();

  const durationMs = run.completedAt ? run.completedAt.getTime() - run.startedAt.getTime() : null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-foreground-subtle">{run.dataset.organisation.name}</p>
      <h1 className="text-xl font-semibold text-foreground">
        <Link href={`/admin/data/datasets/${run.dataset.id}`} className="hover:underline">
          {run.dataset.code}
        </Link>{" "}
        — importrun
      </h1>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Field label="Status">{run.status}</Field>
        <Field label="Gestart">{formatDateTime(run.startedAt)}</Field>
        <Field label="Voltooid">{formatDateTime(run.completedAt)}</Field>
        <Field label="Duur">{formatDuration(durationMs)}</Field>
        <Field label="Bron laatst gewijzigd">{formatDateTime(run.sourceLastModified)}</Field>
        <Field label="Bronversie">{run.sourceVersion ?? "—"}</Field>
        <Field label="Broncontrolesom">{run.sourceChecksum ?? "—"}</Field>
      </dl>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Stat label="Ontvangen" value={run.recordsReceived} />
        <Stat label="Aangemaakt" value={run.recordsCreated} />
        <Stat label="Bijgewerkt" value={run.recordsUpdated} />
        <Stat label="Ongewijzigd" value={run.recordsUnchanged} />
        <Stat label="Afgewezen" value={run.recordsRejected} />
        <Stat label="Uitgesloten (verwacht)" value={run.recordsFiltered} />
      </div>

      {run.warnings ? (
        <>
          <h2 className="mt-8 text-base font-semibold text-foreground">Waarschuwingen</h2>
          <JsonBlock value={run.warnings} />
        </>
      ) : null}

      {run.errors ? (
        <>
          <h2 className="mt-8 text-base font-semibold text-foreground">Fouten</h2>
          <JsonBlock value={run.errors} />
        </>
      ) : null}

      <h2 className="mt-8 text-base font-semibold text-foreground">Ongemapte waarden bij deze run ({run._count.unmappedValues})</h2>
      <div className="mt-3">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Dimensie</AdminTh>
            <AdminTh>Ruwe waarde</AdminTh>
            <AdminTh>Categorie</AdminTh>
            <AdminTh>Ernst</AdminTh>
            <AdminTh>Gedetecteerd</AdminTh>
            <AdminTh>Status</AdminTh>
          </AdminTableHead>
          <tbody>
            {run.unmappedValues.length === 0 ? (
              <AdminEmptyRow colSpan={6}>Geen ongemapte waarden voor deze run.</AdminEmptyRow>
            ) : (
              run.unmappedValues.map((u) => (
                <AdminRow key={u.id}>
                  <AdminTd>{u.dimension}</AdminTd>
                  <AdminTd className="font-mono text-xs">{u.rawValue}</AdminTd>
                  <AdminTd className="text-xs">{u.category}</AdminTd>
                  <AdminTd className="text-xs">{u.severity}</AdminTd>
                  <AdminTd>{formatDateTime(u.detectedAt)}</AdminTd>
                  <AdminTd>{u.status}</AdminTd>
                </AdminRow>
              ))
            )}
          </tbody>
        </AdminTable>
      </div>

      <h2 className="mt-8 text-base font-semibold text-foreground">Revisies bij deze run ({run._count.revisions})</h2>
      <div className="mt-3">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Gedetecteerd</AdminTh>
            <AdminTh className="text-right">Oude waarde</AdminTh>
            <AdminTh className="text-right">Nieuwe waarde</AdminTh>
          </AdminTableHead>
          <tbody>
            {run.revisions.length === 0 ? (
              <AdminEmptyRow colSpan={3}>Geen revisies voor deze run.</AdminEmptyRow>
            ) : (
              run.revisions.map((r) => (
                <AdminRow key={r.id}>
                  <AdminTd>{formatDateTime(r.detectedAt)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.previousValue?.toString() ?? "—"}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.newValue.toString()}</AdminTd>
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
      <dd className="mt-0.5 break-all text-foreground">{children}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">{label}</p>
      <p className="mt-1 tabular-nums text-lg font-semibold text-foreground">{formatInteger(value)}</p>
    </div>
  );
}

// Warnings/errors are recorded by adapters as structured JSON describing what
// went wrong with which record — never raw response bodies or credentials,
// so it's safe to render verbatim here.
function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-border bg-surface-muted p-3 text-xs text-foreground-muted">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
