import { completeComparisonCountries, observationNote } from "@/data/reference/complete-country-comparison";

export interface FiveCountryRow {
  key: string;
  label: string;
  description?: string;
  values: { code: string; display: string; status: string }[];
}

export function FiveCountryTable({ caption, rows }: { caption: string; rows: FiveCountryRow[] }) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-xs text-foreground-muted lg:hidden">Schuif de tabel horizontaal om alle vijf de landen te bekijken.</p>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <p className="px-5 py-4 text-sm font-medium">{caption}</p>
        <div role="region" aria-label={caption} tabIndex={0} className="overflow-x-auto focus-visible:outline-offset-[-2px]">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-y border-border bg-surface-muted">
            <tr><th scope="col" className="w-64 px-5 py-4 text-left font-medium">Indicator</th>{completeComparisonCountries.map((country) => <th key={country.code} scope="col" className={`px-4 py-4 text-right font-medium ${country.code === "BE" ? "text-accent" : ""}`}>{country.name}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => <tr key={row.key}><th scope="row" className="px-5 py-4 text-left align-top font-medium">{row.label}{row.description ? <span className="mt-1 block text-xs font-normal leading-relaxed text-foreground-muted">{row.description}</span> : null}</th>{row.values.map((value) => <td key={value.code} className={`px-4 py-4 text-right align-top tabular-nums ${value.code === "BE" ? "bg-accent-muted/30 font-semibold" : ""}`}><span className="whitespace-nowrap">{value.display}</span>{value.status ? <span className="mt-1 block max-w-36 text-xs font-normal leading-relaxed text-foreground-muted">{observationNote(value.status)}</span> : null}</td>)}</tr>)}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
