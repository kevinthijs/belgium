import Link from "next/link";
import { getAdminOverview } from "@/server/admin/queries/overview";
import { SummaryCard } from "@/components/admin/summary-card";
import { HealthBadge } from "@/components/admin/health-badge";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format/datetime";
import { formatInteger } from "@/lib/format/money";

export const dynamic = "force-dynamic";

export default async function AdminDataOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Data health</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Of de publiek getoonde cijfers momenteel te vertrouwen zijn, in één oogopslag.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <SummaryCard label="Bronnen" value={formatInteger(overview.sourceCount)} />
        <SummaryCard label="Datasets" value={formatInteger(overview.datasetCount)} />
        <SummaryCard label="Observaties" value={formatInteger(overview.observationCount)} />
        <SummaryCard label="Laatste import" value={overview.latestImportAt ? formatDateTime(overview.latestImportAt) : "—"} />
        <SummaryCard label="Ongemapt (open)" value={formatInteger(overview.unmappedCount)} />
        <SummaryCard label="Revisies" value={formatInteger(overview.revisionCount)} />
        <SummaryCard label="Afgewezen records" value={formatInteger(overview.failedRecordsCount)} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {(["HEALTHY", "WARNING", "STALE", "FAILED", "NEVER_IMPORTED"] as const).map((state) => (
          <div key={state} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
            <HealthBadge state={state} />
            <span className="tabular-nums text-sm font-medium text-foreground">{overview.healthCounts[state]}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-base font-semibold text-foreground">Datasets</h2>
      <div className="mt-3">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Organisatie</AdminTh>
            <AdminTh>Dataset</AdminTh>
            <AdminTh>Laatste succesvolle import</AdminTh>
            <AdminTh>Laatste periode</AdminTh>
            <AdminTh className="text-right">Observaties</AdminTh>
            <AdminTh>Gezondheid</AdminTh>
          </AdminTableHead>
          <tbody>
            {overview.datasets.map((d) => (
              <AdminRow key={d.id}>
                <AdminTd>{d.organisationName}</AdminTd>
                <AdminTd>
                  <Link href={`/admin/data/datasets/${d.id}`} className="font-medium text-accent hover:underline">
                    {d.code}
                  </Link>
                  <div className="text-xs text-foreground-subtle">{d.name}</div>
                </AdminTd>
                <AdminTd>{formatDateTime(d.lastSuccessfulImportAt)}</AdminTd>
                <AdminTd>{d.latestAvailablePeriod ?? "—"}</AdminTd>
                <AdminTd className="text-right tabular-nums">{formatInteger(d.observationCount)}</AdminTd>
                <AdminTd>
                  <HealthBadge state={d.health.state} />
                </AdminTd>
              </AdminRow>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
