import Link from "next/link";
import { getRevisions } from "@/server/admin/queries/revisions";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { Pager } from "@/components/admin/pager";
import { formatDate } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

export default async function RevisionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;

  const result = await getRevisions({
    datasetId: params.datasetId,
    fromDate: params.from ? new Date(params.from) : undefined,
    toDate: params.to ? new Date(params.to) : undefined,
    page,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Revisies</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
        Officiële statistieken worden routinematig herzien wanneer bronnen bijgewerkte cijfers publiceren. Dit is geen
        foutenlijst — het toont waar en wanneer een eerder gepubliceerde waarde is vervangen door een nieuwere.
      </p>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/admin/data/revisions">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Vanaf</span>
          <input type="date" name="from" defaultValue={params.from ?? ""} className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Tot</span>
          <input type="date" name="to" defaultValue={params.to ?? ""} className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground" />
        </label>
        <button type="submit" className="rounded-sm border border-border px-3 py-1.5 text-foreground-muted hover:bg-surface-muted">
          Filter
        </button>
        <Link href="/admin/data/revisions" className="text-foreground-subtle underline decoration-dotted underline-offset-2">
          Reset
        </Link>
      </form>

      <div className="mt-4">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Gedetecteerd</AdminTh>
            <AdminTh>Dataset</AdminTh>
            <AdminTh>Entiteit</AdminTh>
            <AdminTh>Metric</AdminTh>
            <AdminTh>Periode</AdminTh>
            <AdminTh className="text-right">Oude waarde</AdminTh>
            <AdminTh className="text-right">Nieuwe waarde</AdminTh>
            <AdminTh className="text-right">Verschil</AdminTh>
            <AdminTh className="text-right">%</AdminTh>
            <AdminTh>Importrun</AdminTh>
          </AdminTableHead>
          <tbody>
            {result.items.length === 0 ? (
              <AdminEmptyRow colSpan={10}>Geen revisies voor deze filters.</AdminEmptyRow>
            ) : (
              result.items.map((r) => (
                <AdminRow key={r.id}>
                  <AdminTd>{formatDate(r.detectedAt)}</AdminTd>
                  <AdminTd className="font-mono text-xs">{r.datasetCode}</AdminTd>
                  <AdminTd>{r.entityName}</AdminTd>
                  <AdminTd>{r.metricCode}</AdminTd>
                  <AdminTd>{r.periodLabel}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.previousValue ?? "—"}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.newValue}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.absoluteDifference ?? "—"}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.percentageDifference ?? "—"}</AdminTd>
                  <AdminTd>
                    {r.importRunId ? (
                      <Link href={`/admin/data/imports/${r.importRunId}`} className="text-accent hover:underline">
                        bekijk
                      </Link>
                    ) : (
                      "—"
                    )}
                  </AdminTd>
                </AdminRow>
              ))
            )}
          </tbody>
        </AdminTable>
        <Pager page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/data/revisions" searchParams={params} />
      </div>
    </div>
  );
}
