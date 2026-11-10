import Link from "next/link";
import { getImportRuns } from "@/server/admin/queries/imports";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { Pager } from "@/components/admin/pager";
import { formatDateTime, formatDuration } from "@/lib/format/datetime";
import { formatInteger } from "@/lib/format/money";
import type { ImportRunStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const status = params.status as ImportRunStatus | undefined;

  const result = await getImportRuns({
    datasetId: params.datasetId,
    status,
    page,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Importruns</h1>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/admin/data/imports">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Status</span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">Alle</option>
            {(["RUNNING", "SUCCESS", "PARTIAL_SUCCESS", "FAILED"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-sm border border-border px-3 py-1.5 text-foreground-muted hover:bg-surface-muted">
          Filter
        </button>
        <Link href="/admin/data/imports" className="text-foreground-subtle underline decoration-dotted underline-offset-2">
          Reset
        </Link>
      </form>

      <div className="mt-4">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Gestart</AdminTh>
            <AdminTh>Voltooid</AdminTh>
            <AdminTh>Dataset</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Ontvangen</AdminTh>
            <AdminTh className="text-right">Aangemaakt</AdminTh>
            <AdminTh className="text-right">Bijgewerkt</AdminTh>
            <AdminTh className="text-right">Ongewijzigd</AdminTh>
            <AdminTh className="text-right">Afgewezen</AdminTh>
            <AdminTh className="text-right">Uitgesloten</AdminTh>
            <AdminTh className="text-right">Revisies</AdminTh>
            <AdminTh>Duur</AdminTh>
          </AdminTableHead>
          <tbody>
            {result.items.length === 0 ? (
              <AdminEmptyRow colSpan={12}>Geen importruns voor deze filters.</AdminEmptyRow>
            ) : (
              result.items.map((run) => (
                <AdminRow key={run.id}>
                  <AdminTd>
                    <Link href={`/admin/data/imports/${run.id}`} className="text-accent hover:underline">
                      {formatDateTime(run.startedAt)}
                    </Link>
                  </AdminTd>
                  <AdminTd>{formatDateTime(run.completedAt)}</AdminTd>
                  <AdminTd>
                    <span className="font-medium">{run.datasetCode}</span>
                    <div className="text-xs text-foreground-subtle">{run.organisationName}</div>
                  </AdminTd>
                  <AdminTd>{run.status}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsReceived)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsCreated)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsUpdated)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsUnchanged)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.recordsRejected)}</AdminTd>
                  <AdminTd className="text-right tabular-nums text-foreground-subtle">{formatInteger(run.recordsFiltered)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(run.revisionCount)}</AdminTd>
                  <AdminTd>{formatDuration(run.durationMs)}</AdminTd>
                </AdminRow>
              ))
            )}
          </tbody>
        </AdminTable>
        <Pager page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/data/imports" searchParams={params} />
      </div>
    </div>
  );
}
