import Link from "next/link";
import { getImportErrors } from "@/server/admin/queries/errors";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

export default async function ErrorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const errors = await getImportErrors(params.datasetId);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Fouten</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
        Importruns die zijn mislukt of records hebben afgewezen. Dit toont alleen echte fouten — routinematige
        ongemapte waarden staan op de aparte pagina.
      </p>

      <div className="mt-4">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Gestart</AdminTh>
            <AdminTh>Dataset</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Afgewezen</AdminTh>
            <AdminTh>Foutmelding(en)</AdminTh>
          </AdminTableHead>
          <tbody>
            {errors.length === 0 ? (
              <AdminEmptyRow colSpan={5}>Geen fouten geregistreerd.</AdminEmptyRow>
            ) : (
              errors.map((e) => (
                <AdminRow key={e.importRunId}>
                  <AdminTd>
                    <Link href={`/admin/data/imports/${e.importRunId}`} className="text-accent hover:underline">
                      {formatDateTime(e.startedAt)}
                    </Link>
                  </AdminTd>
                  <AdminTd className="font-mono text-xs">{e.datasetCode}</AdminTd>
                  <AdminTd>{e.status}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{e.recordsRejected}</AdminTd>
                  <AdminTd className="max-w-md text-xs text-foreground-muted">
                    {e.errors ? (
                      <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(e.errors, null, 2)}</pre>
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
    </div>
  );
}
