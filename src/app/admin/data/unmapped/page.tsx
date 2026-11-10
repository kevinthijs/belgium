import Link from "next/link";
import { getUnmappedGrouped, getUnmappedSummary } from "@/server/admin/queries/unmapped";
import { AdminTable, AdminTableHead, AdminTh, AdminTd, AdminRow, AdminEmptyRow } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format/datetime";
import { formatInteger } from "@/lib/format/money";
import { MarkReviewedButton } from "./mark-reviewed-button";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "UNEXPECTED",
  "EXPECTED_UNSUPPORTED",
  "HISTORICAL_ENTITY",
  "MISSING_CANONICAL_ENTITY",
  "MISSING_CLASSIFICATION",
  "MISSING_METRIC_MAPPING",
  "MISSING_UNIT_MAPPING",
  "INVALID_SOURCE_VALUE",
  "SOURCE_SCHEMA_CHANGE",
  "OTHER",
] as const;

const SEVERITIES = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;
const STATUSES = ["OPEN", "REVIEWED", "IGNORED_EXPECTED", "RESOLVED"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  UNEXPECTED: "Onverwacht",
  EXPECTED_UNSUPPORTED: "Verwacht, niet ondersteund",
  HISTORICAL_ENTITY: "Historische entiteit",
  MISSING_CANONICAL_ENTITY: "Ontbrekende entiteit",
  MISSING_CLASSIFICATION: "Ontbrekende classificatie",
  MISSING_METRIC_MAPPING: "Ontbrekende metric-mapping",
  MISSING_UNIT_MAPPING: "Ontbrekende eenheid-mapping",
  INVALID_SOURCE_VALUE: "Ongeldige bronwaarde",
  SOURCE_SCHEMA_CHANGE: "Bronschema gewijzigd",
  OTHER: "Overig",
};

const SEVERITY_STYLES: Record<string, string> = {
  INFO: "text-foreground-subtle",
  WARNING: "text-amber-600",
  ERROR: "text-red-600",
  CRITICAL: "text-red-700 font-semibold",
};

export default async function UnmappedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const includeResolved = params.includeResolved === "true";
  const filters = {
    datasetId: params.datasetId,
    dimension: params.dimension,
    category: params.category,
    severity: params.severity,
    status: params.status,
    includeResolved,
  };

  const [groups, summary] = await Promise.all([getUnmappedGrouped(filters), getUnmappedSummary(filters)]);

  const dimensions = [...new Set(groups.map((g) => g.dimension))].sort();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Ongemapte waarden</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
        Waarden die de bron levert maar die (nog) niet op een canonieke entiteit, classificatie of dimensie zijn
        afgebeeld. Ze worden nooit stilzwijgend genegeerd — deze pagina is de plek om ze op te sporen, te classificeren
        en te beoordelen. Een hoog aantal is niet per se een probleem: alleen &quot;Onverwacht&quot; en ernst boven
        INFO verdienen aandacht.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
        <div>
          <span className="text-foreground-subtle">Totaal (huidige filters):</span>{" "}
          <span className="font-medium text-foreground">{formatInteger(summary.totalOccurrences)}</span>
        </div>
        {summary.byCategory.map((c) => (
          <div key={c.category}>
            <span className="text-foreground-subtle">{CATEGORY_LABELS[c.category] ?? c.category}:</span>{" "}
            <span className="font-medium text-foreground">{formatInteger(c.occurrenceCount)}</span>
          </div>
        ))}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/admin/data/unmapped">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Dimensie</span>
          <select name="dimension" defaultValue={params.dimension ?? ""} className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground">
            <option value="">Alle</option>
            {dimensions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Categorie</span>
          <select name="category" defaultValue={params.category ?? ""} className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground">
            <option value="">Alle</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Ernst</span>
          <select name="severity" defaultValue={params.severity ?? ""} className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground">
            <option value="">Alle</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Status</span>
          <select name="status" defaultValue={params.status ?? ""} className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-foreground">
            <option value="">Alle</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-1.5">
          <input type="checkbox" name="includeResolved" value="true" defaultChecked={includeResolved} className="h-4 w-4" />
          <span className="text-foreground-muted">Ook beoordeelde tonen</span>
        </label>
        <button type="submit" className="rounded-sm border border-border px-3 py-1.5 text-foreground-muted hover:bg-surface-muted">
          Filter
        </button>
        <Link href="/admin/data/unmapped" className="text-foreground-subtle underline decoration-dotted underline-offset-2">
          Reset
        </Link>
      </form>

      <div className="mt-4">
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Dataset</AdminTh>
            <AdminTh>Dimensie</AdminTh>
            <AdminTh>Broncode / -label</AdminTh>
            <AdminTh>Categorie</AdminTh>
            <AdminTh>Ernst</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Voorkomens</AdminTh>
            <AdminTh>Eerst gezien</AdminTh>
            <AdminTh>Laatst gezien</AdminTh>
            <AdminTh>Actie</AdminTh>
          </AdminTableHead>
          <tbody>
            {groups.length === 0 ? (
              <AdminEmptyRow colSpan={10}>Geen ongemapte waarden voor deze filters.</AdminEmptyRow>
            ) : (
              groups.map((g) => (
                <AdminRow key={`${g.datasetCode}-${g.dimension}-${g.rawValue}`}>
                  <AdminTd className="font-mono text-xs">{g.datasetCode}</AdminTd>
                  <AdminTd>{g.dimension}</AdminTd>
                  <AdminTd className="font-mono text-xs">{g.rawValue}</AdminTd>
                  <AdminTd>{CATEGORY_LABELS[g.category] ?? g.category}</AdminTd>
                  <AdminTd className={SEVERITY_STYLES[g.severity] ?? ""}>{g.severity}</AdminTd>
                  <AdminTd>{g.latestStatus}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatInteger(g.occurrenceCount)}</AdminTd>
                  <AdminTd>{formatDateTime(g.firstDetectedAt)}</AdminTd>
                  <AdminTd>{formatDateTime(g.lastDetectedAt)}</AdminTd>
                  <AdminTd>
                    {g.resolvedCount > 0 && g.resolvedCount >= g.occurrenceCount ? (
                      <span className="text-xs text-foreground-subtle">{g.latestStatus}</span>
                    ) : (
                      <MarkReviewedButton datasetCode={g.datasetCode} dimension={g.dimension} rawValue={g.rawValue} />
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
