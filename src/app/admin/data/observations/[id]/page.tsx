import Link from "next/link";
import { notFound } from "next/navigation";
import { getObservationDetail } from "@/server/admin/queries/observations";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

export default async function ObservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getObservationDetail(id);
  if (!detail) notFound();

  const { observation: o, derivationDefinitionsUsingThisMetric } = detail;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-foreground-subtle">{o.source.organisation.name}</p>
      <h1 className="text-xl font-semibold text-foreground">
        {o.metric.name} — {o.entity.name} ({o.period.label})
      </h1>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Field label="Canonieke waarde">
          {o.value.toString()} {o.unit.code}
        </Field>
        {o.sourceDimensions ? (
          <Field label="Brongegevens (native)">
            <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(o.sourceDimensions, null, 2)}</pre>
          </Field>
        ) : null}
        <Field label="Entiteit">{o.entity.name}</Field>
        <Field label="Metric">
          {o.metric.code} — {o.metric.name}
        </Field>
        <Field label="Periode">{o.period.label}</Field>
        <Field label="Sector">{o.entity.statisticalSectorId ?? "—"}</Field>
        <Field label="Classificatie">
          {o.classificationItem ? `${o.classificationItem.system.name}: ${o.classificationItem.code} — ${o.classificationItem.name}` : "—"}
        </Field>
        <Field label="Eenheid">{o.unit.code}</Field>
        <Field label="Raamwerk">{o.accountingFramework?.name ?? "—"}</Field>
        <Field label="Status">{o.status}</Field>
        <Field label="Kwaliteit">{o.qualityStatus}</Field>
        <Field label="Dataset">
          <Link href={`/admin/data/datasets/${o.source.id}`} className="text-accent hover:underline">
            {o.source.code}
          </Link>
        </Field>
        <Field label="Opgehaald op">{formatDateTime(o.importedAt)}</Field>
        <Field label="Gepubliceerd op">{formatDateTime(o.publishedAt)}</Field>
        <Field label="Laatst herzien">{formatDateTime(o.revisedAt)}</Field>
      </dl>

      <h2 className="mt-8 text-base font-semibold text-foreground">Revisiegeschiedenis ({o.revisions.length})</h2>
      <div className="mt-3">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Gedetecteerd</AdminTh>
            <AdminTh className="text-right">Oude waarde</AdminTh>
            <AdminTh className="text-right">Nieuwe waarde</AdminTh>
            <AdminTh>Importrun</AdminTh>
          </AdminTableHead>
          <tbody>
            {o.revisions.length === 0 ? (
              <AdminEmptyRow colSpan={4}>Geen revisies — deze waarde is nooit gewijzigd sinds import.</AdminEmptyRow>
            ) : (
              o.revisions.map((r) => (
                <AdminRow key={r.id}>
                  <AdminTd>{formatDateTime(r.detectedAt)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.previousValue?.toString() ?? "—"}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{r.newValue.toString()}</AdminTd>
                  <AdminTd>
                    {r.importRunId ? (
                      <Link href={`/admin/data/imports/${r.importRunId}`} className="text-accent hover:underline">
                        bekijk run
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
      </div>

      <h2 className="mt-8 text-base font-semibold text-foreground">Gebruikt in afgeleide berekeningen</h2>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        {derivationDefinitionsUsingThisMetric.length === 0 ? (
          <p className="text-sm text-foreground-subtle">Deze metric is geen input voor een afgeleide berekening.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
            {derivationDefinitionsUsingThisMetric.map((d) => (
              <li key={d.id}>
                {d.code} — {d.name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-foreground-subtle">
          Afgeleide metrics (bv. schuld per capita) worden bij weergave berekend en niet als aparte observaties opgeslagen.
        </p>
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
