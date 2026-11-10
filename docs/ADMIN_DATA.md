# `/admin/data` — internal data health dashboard

Internal operational tooling for the site operator and developers. It
answers one question: **can the financial data shown publicly be trusted
right now?** It is not a public feature and is not linked from the public
site.

## Access control

HTTP Basic Auth, enforced in `src/middleware.ts` for every `/admin/:path*`
request. Credentials come from the `ADMIN_USERNAME`/`ADMIN_PASSWORD`
environment variables. If either is unset, every request to `/admin/*` is
rejected with `503` — the page fails closed, never open.

This was chosen deliberately over building any kind of user-management
system: there is exactly one class of user (the operator/developer), and a
shared HTTP-level credential behind Caddy's TLS termination is the smallest
solution that actually fits this app's infrastructure.

Defense in depth against accidental indexing:
- `src/app/robots.ts` disallows `/admin` for all crawlers.
- `src/app/admin/layout.tsx` additionally sets `robots: { index: false,
  follow: false, nocache: true }` on every admin page.

Neither of these is the actual access control — Basic Auth is. They only
guard against a crawler that ignores `robots.txt` and somehow reaches a page
without credentials being requested (which shouldn't happen, since the
middleware runs first).

## Health states

Computed by a single function, `getDatasetHealth()` in
`src/server/admin/dataset-health.ts`. No UI component hardcodes a health
verdict or compares dates directly — every date-based judgement flows
through this module so the rules stay in one place and are unit-testable
without a database.

States, in order of precedence (first match wins):

| State | Meaning |
|---|---|
| `NEVER_IMPORTED` | The dataset has never had a successful import. |
| `FAILED` | The most recent import attempt failed, even if an earlier one succeeded. |
| `STALE` | The last successful import is older than the source's expected update cadence. |
| `WARNING` | One or more non-blocking concerns (see below), but not stale or failed. |
| `HEALTHY` | Enabled, fresh, no rejections, no open unmapped values. |

`WARNING` can be raised by any combination of: dataset disabled
(`isEnabled = false`), staleness approaching its threshold (see below), the
latest import run rejecting records, unresolved unmapped values detected
since the last success, or the latest run being only a `PARTIAL_SUCCESS`.
Each reason is rendered as its own line of explanatory text next to the
health badge — never just a color.

## Staleness rules

`computeStaleness()`, also in `dataset-health.ts`. Deliberately **not** one
global "older than N hours" rule — a quarterly Eurostat series and a
monthly one are different concepts, and marking an annual dataset stale
after a few weeks would just be noise.

| Frequency | Stale after | Warning zone starts at |
|---|---|---|
| `MONTHLY` | 45 days | 75% → ~34 days |
| `QUARTERLY` | 120 days | 75% → 90 days |
| `ANNUAL` | 400 days | 75% → 300 days |
| `IRREGULAR` | never (time-based) | — |

These windows include a deliberate grace period for real-world publication
lag (Eurostat quarterly debt data is typically published ~3 months after
quarter-end; annual accounts can lag well over a year for a final vintage).
`IRREGULAR` datasets can still become `NEVER_IMPORTED` or `FAILED` — they
just never go `STALE` purely from elapsed time.

## Revision semantics

**Revisions are never described as errors.** Official statistics are
routinely revised as sources publish updated vintages of the same period.
`/admin/data/revisions` shows what changed, when, and by how much
(`src/server/admin/revision-diff.ts` computes the absolute and percentage
difference, and is careful never to divide by zero — a previous value of
exactly `0` yields no percentage figure). Every observation's full revision
history is preserved (`ObservationRevision`); nothing is ever silently
overwritten.

## Unmapped values workflow

`/admin/data/unmapped` groups `UnmappedSourceValue` rows by
(dataset, dimension, raw value) using DB-level `groupBy()` — the table
currently holds tens of thousands of rows, so it is never loaded into the
app wholesale. Each group shows an occurrence count and first/last-seen
timestamps.

An operator can mark a group **reviewed**, which sets `resolvedAt` on the
underlying rows. This is the only "action" available on the page, and it is
intentionally not a delete: a reviewed value is still visible (toggle
"Ook beoordeelde tonen") and its history is preserved. Actually mapping a
raw value onto a canonical entity/classification/dimension is a code change
(the import adapters' dimension mappers), not something this page does —
the page's job is to make sure unmapped values are never silently dropped
and are easy to find, not to be a live mapping editor.

## Manual import trigger

Dataset detail pages for a small allow-list of datasets
(`src/server/admin/manual-import.ts`, `MANUALLY_TRIGGERABLE_DATASETS`) show
"Bron controleren" (check source) and "Import starten" (run import)
buttons, backed by Server Actions with a confirmation dialog. A running
import for the same dataset blocks a second concurrent trigger.

The allow-list mirrors the existing `scripts/import-*.ts` CLI scripts
1:1 — the UI trigger can never do anything the CLI script couldn't already
do. Currently covers the four Eurostat adapters (`gov_10q_ggdebt`,
`gov_10a_main`, `gov_10a_exp`, `gov_10a_taxag`).

**Statbel population is deliberately excluded.** Unlike the Eurostat
datasets, it needs municipality entities provisioned first
(`npm run seed:statbel:municipalities`), and its adapter downloads a large
XLSX file — running that synchronously inside a web request isn't safe
without a background job queue, which this app doesn't have yet. Documented
here rather than implemented as a brittle synchronous workaround.

## Database safety

The admin interface is **read-only by design**, with the single, narrow
exception of marking an unmapped value reviewed (`resolvedAt`) and creating
new `ImportRun`/`Observation`/`ObservationRevision` rows via the manual
import trigger — i.e. exactly the same writes the existing import pipeline
already performs. There is no delete-observation, edit-financial-value, or
overwrite-source-data action anywhere in `/admin/data`. Manual corrections
to how source data maps onto canonical entities/classifications happen
through the import/mapping code, not by hand-editing observations.

## Performance

Every high-volume list (`/admin/data/observations`, `/admin/data/imports`,
`/admin/data/revisions`) is filtered and paginated server-side
(`src/server/admin/pagination.ts`, default page size 50, max 200) — the
browser never receives more than one page of rows.

New Prisma indexes added for this dashboard's query patterns:

| Model | Index | Why |
|---|---|---|
| `Observation` | `sourceId` | Dataset detail stats and the observation inspector both filter by dataset. |
| `ObservationRevision` | `importRunId` | Revision counts/listings are frequently scoped to a dataset via `importRun.datasetId`, which joins through this column. |
| `ImportRun` | `(datasetId, startedAt)` | Dataset detail/overview load runs per dataset ordered by recency. |
| `ImportRun` | `status` | The import runs list supports filtering by status alone. |

No index was added without a specific query pattern behind it.
