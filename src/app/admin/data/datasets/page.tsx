import Link from "next/link";
import { getDatasetHealthRows } from "@/server/admin/queries/overview";
import { HealthBadge } from "@/components/admin/health-badge";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format/datetime";
import { formatInteger } from "@/lib/format/money";
import type { HealthState } from "@/server/admin/dataset-health";

export const dynamic = "force-dynamic";

type SortKey = "organisation" | "code" | "lastSuccess" | "observations" | "health";

export default async function DatasetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const allRows = await getDatasetHealthRows();

  const organisations = [...new Set(allRows.map((r) => r.organisationCode))].sort();

  let rows = allRows;
  if (params.org) rows = rows.filter((r) => r.organisationCode === params.org);
  if (params.health) rows = rows.filter((r) => r.health.state === params.health);
  if (params.enabled) rows = rows.filter((r) => String(r.isEnabled) === params.enabled);
  if (params.frequency) rows = rows.filter((r) => r.frequency === params.frequency);

  const sort = (params.sort as SortKey | undefined) ?? "organisation";
  const dir = params.dir === "desc" ? -1 : 1;
  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case "code":
        return dir * a.code.localeCompare(b.code);
      case "lastSuccess":
        return dir * ((a.lastSuccessfulImportAt?.getTime() ?? 0) - (b.lastSuccessfulImportAt?.getTime() ?? 0));
      case "observations":
        return dir * (a.observationCount - b.observationCount);
      case "health":
        return dir * a.health.state.localeCompare(b.health.state);
      default:
        return dir * a.organisationName.localeCompare(b.organisationName);
    }
  });

  function sortLink(key: SortKey, label: string) {
    const nextDir = sort === key && dir === 1 ? "desc" : "asc";
    const qp = new URLSearchParams({ ...stripUndefined(params), sort: key, dir: nextDir });
    return (
      <Link href={`/admin/data/datasets?${qp.toString()}`} className="hover:text-foreground">
        {label} {sort === key ? (dir === 1 ? "↑" : "↓") : ""}
      </Link>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Datasets</h1>

      <form className="mt-4 flex flex-wrap gap-3 text-sm" action="/admin/data/datasets">
        <Select name="org" label="Organisatie" value={params.org} options={organisations.map((o) => ({ value: o, label: o }))} />
        <Select
          name="health"
          label="Gezondheid"
          value={params.health}
          options={(["HEALTHY", "WARNING", "STALE", "FAILED", "NEVER_IMPORTED"] as HealthState[]).map((h) => ({ value: h, label: h }))}
        />
        <Select name="enabled" label="Ingeschakeld" value={params.enabled} options={[{ value: "true", label: "Ja" }, { value: "false", label: "Nee" }]} />
        <Select
          name="frequency"
          label="Type"
          value={params.frequency}
          options={["ANNUAL", "QUARTERLY", "MONTHLY", "IRREGULAR"].map((f) => ({ value: f, label: f }))}
        />
        <button type="submit" className="self-end rounded-sm border border-border px-3 py-1.5 text-foreground-muted hover:bg-surface-muted">
          Filter
        </button>
        <Link href="/admin/data/datasets" className="self-end text-foreground-subtle underline decoration-dotted underline-offset-2">
          Reset
        </Link>
      </form>

      <div className="mt-4">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>{sortLink("organisation", "Organisatie")}</AdminTh>
            <AdminTh>{sortLink("code", "Dataset")}</AdminTh>
            <AdminTh>Beschrijving</AdminTh>
            <AdminTh>{sortLink("lastSuccess", "Laatste succes")}</AdminTh>
            <AdminTh>Laatste poging</AdminTh>
            <AdminTh>Periode</AdminTh>
            <AdminTh className="text-right">{sortLink("observations", "Observaties")}</AdminTh>
            <AdminTh className="text-right">Aangemaakt</AdminTh>
            <AdminTh className="text-right">Bijgewerkt</AdminTh>
            <AdminTh className="text-right">Afgewezen</AdminTh>
            <AdminTh className="text-right">Ongemapt</AdminTh>
            <AdminTh className="text-right">Revisies</AdminTh>
            <AdminTh>{sortLink("health", "Gezondheid")}</AdminTh>
          </AdminTableHead>
          <tbody>
            {rows.length === 0 ? (
              <AdminEmptyRow colSpan={13}>Geen datasets voor deze filters.</AdminEmptyRow>
            ) : (
              rows.map((d) => (
                <AdminRow key={d.id}>
                  <AdminTd>{d.organisationName}</AdminTd>
                  <AdminTd>
                    <Link href={`/admin/data/datasets/${d.id}`} className="font-medium text-accent hover:underline">
                      {d.code}
                    </Link>
                    {!d.isEnabled ? <div className="text-xs text-foreground-subtle">uitgeschakeld</div> : null}
                  </AdminTd>
                  <AdminTd className="max-w-[220px] text-xs text-foreground-muted">{d.description ?? "—"}</AdminTd>
                  <AdminTd>{formatDateTime(d.lastSuccessfulImportAt)}</AdminTd>
                  <AdminTd>
                    {formatDateTime(d.lastAttemptAt)}
                    {d.lastAttemptStatus ? <div className="text-xs text-foreground-subtle">{d.lastAttemptStatus}</div> : null}
                  </AdminTd>
                  <AdminTd>{d.latestAvailablePeriod ?? "—"}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(d.observationCount)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(d.createdCount)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(d.updatedCount)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(d.rejectedCount)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(d.unmappedCount)}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(d.revisionCount)}</AdminTd>
                  <AdminTd>
                    <HealthBadge state={d.health.state} />
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

function stripUndefined(obj: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) if (value) result[key] = value;
  return result;
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
      >
        <option value="">Alle</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
