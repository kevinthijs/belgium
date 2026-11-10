import Link from "next/link";
import { getObservations } from "@/server/admin/queries/observations";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { Pager } from "@/components/admin/pager";
import { formatDateTime } from "@/lib/format/datetime";
import type { ObservationStatus, QualityStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export default async function ObservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;

  const result = await getObservations({
    entityId: params.entityId,
    metricId: params.metricId,
    periodId: params.periodId,
    datasetId: params.datasetId,
    sectorId: params.sectorId,
    frameworkId: params.frameworkId,
    classificationItemId: params.classificationItemId,
    unitId: params.unitId,
    status: params.status as ObservationStatus | undefined,
    quality: params.quality as QualityStatus | undefined,
    page,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Observaties</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        {result.total.toLocaleString("nl-BE")} observaties totaal — server-side gefilterd en gepagineerd.
      </p>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/admin/data/observations">
        <TextInput name="datasetId" label="Dataset-ID" value={params.datasetId} />
        <TextInput name="entityId" label="Entiteit-ID" value={params.entityId} />
        <TextInput name="metricId" label="Metric-ID" value={params.metricId} />
        <TextInput name="periodId" label="Periode-ID" value={params.periodId} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Status</span>
          <select name="status" defaultValue={params.status ?? ""} className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground">
            <option value="">Alle</option>
            {["PRELIMINARY", "PROVISIONAL", "ESTIMATED", "FINAL"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-sm border border-border px-3 py-1.5 text-foreground-muted hover:bg-surface-muted">
          Filter
        </button>
        <Link href="/admin/data/observations" className="text-foreground-subtle underline decoration-dotted underline-offset-2">
          Reset
        </Link>
      </form>

      <div className="mt-4">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Entiteit</AdminTh>
            <AdminTh>Metric</AdminTh>
            <AdminTh>Periode</AdminTh>
            <AdminTh className="text-right">Waarde</AdminTh>
            <AdminTh>Eenheid</AdminTh>
            <AdminTh>Sector</AdminTh>
            <AdminTh>Classificatie</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Bron</AdminTh>
            <AdminTh>Bijgewerkt</AdminTh>
          </AdminTableHead>
          <tbody>
            {result.items.length === 0 ? (
              <AdminEmptyRow colSpan={10}>Geen observaties voor deze filters.</AdminEmptyRow>
            ) : (
              result.items.map((o) => (
                <AdminRow key={o.id}>
                  <AdminTd>{o.entityName}</AdminTd>
                  <AdminTd>
                    <Link href={`/admin/data/observations/${o.id}`} className="text-accent hover:underline">
                      {o.metricCode}
                    </Link>
                  </AdminTd>
                  <AdminTd>{o.periodLabel}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{o.value}</AdminTd>
                  <AdminTd>{o.unitCode}</AdminTd>
                  <AdminTd>{o.sectorName ?? "—"}</AdminTd>
                  <AdminTd className="text-xs">{o.classificationLabel ?? "—"}</AdminTd>
                  <AdminTd>{o.status}</AdminTd>
                  <AdminTd className="font-mono text-xs">{o.datasetCode}</AdminTd>
                  <AdminTd>{formatDateTime(o.updatedAt)}</AdminTd>
                </AdminRow>
              ))
            )}
          </tbody>
        </AdminTable>
        <Pager page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/data/observations" searchParams={params} />
      </div>
    </div>
  );
}

function TextInput({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={value ?? ""}
        className="w-40 rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
      />
    </label>
  );
}
