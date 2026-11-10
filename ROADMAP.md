# Roadmap — Belgische Staatsrekening

## Status: live

`https://belgie.dakkofferverhuur.be` — Next.js app in `belgium-staatsrekening-web`,
Postgres in `belgium-staatsrekening-db`, reverse-proxied by the shared Caddy
instance in `/docker/caddy` (see `UPSTREAMS.md`, upstream `127.0.0.1:3140`).

## Phase 1 — done

- Generic Entity + Metric + Period + Observation data model (Prisma/Postgres),
  no per-metric tables.
- Eurostat `gov_10q_ggdebt` adapter (JSON-stat 2.0), imported and mapped to
  Belgium + 4 comparison countries + EU aggregate.
- Revision tracking, unmapped-value tracking, import runs, comparability
  engine (`checkComparability`).
- `LINEAR_RECENT_DEBT_CHANGE` debt estimate model, animated client-side.
- Homepage: hero/debt counter, Belgium overview, debt history, international
  comparison, data updates, source trust — all wired to real data, with
  honest empty states (not fabricated numbers) for sections lacking data.
- i18n scaffolding (nl canonical, fr/de/en translated, only nl enabled).
- Design tokens, chart abstractions, centralized number formatting.
- Full validation: Prisma validate, lint, typecheck, unit tests (37/37),
  production build — all green.
- Dockerized deployment: multi-stage `Dockerfile`, `docker-compose.yml`
  (`db` + `web`), production rendering set to `force-dynamic` (DB isn't
  reachable at image-build time, so ISR is deferred — see below).

## Known trade-offs to revisit

- **Rendering mode**: homepage is `force-dynamic` (SSR per request) instead
  of the originally-specified hourly ISR, because `docker build` has no
  access to Postgres. Options to restore ISR: build with `--network host`
  against an already-running `db` container, or move to a build step that
  runs after deploy (`next build` triggered post-container-start).
- **Caddyfile edits**: this repo's tooling writes files via atomic
  replace-and-rename, which orphans Docker's single-file bind mount inside
  the already-running Caddy container. A `caddy reload` alone won't pick up
  Caddyfile changes — the container needs an actual restart
  (`docker compose restart caddy`) after any Caddyfile edit.

## Phase 2

### Statbel population import — done

- Source: Statbel "Bevolking per gemeente op 1 januari" (1992-2026),
  `https://statbel.fgov.be/nl/themas/bevolking/structuur-van-de-bevolking`,
  official legal population, XLSX, one sheet per year, NIS-coded rows for
  country/regions/provinces/arrondissements/municipalities, CC BY 4.0.
  Reference date is always 1 January — modeled as `PeriodType.DATE` with
  an explicit `StatisticalPeriod.referenceDate`, never averaged into a
  YEAR period.
- `StatbelPopulationAdapter` (`src/data/adapters/statbel/`) reuses the
  existing generic `DataSourceAdapter`/`runImport` pipeline unchanged —
  only `resolve-period.ts` gained `DATE` support (schema already had the
  field, no migration needed).
- Entity mapping is NIS-code-only via `ExternalEntityIdentifier(scheme:
  "NIS")`, never by name. National + 3 regions seeded directly; all 567
  current municipalities provisioned by
  `npm run seed:statbel:municipalities` (upserts `GovernmentEntity` +
  NIS identifier, matched by code). Historical NIS codes that no longer
  exist after municipal mergers are reported as `UnmappedSourceValue`
  rows, never silently dropped.
- `governmentDebtPerCapita` (`src/data/derivations/debt-per-capita.ts`)
  is computed on read via the `DerivationDefinition` pattern (seeded as
  `DEBT_PER_CAPITA`), not persisted as an Observation. Period-matching
  rule: use the population observation whose period year equals the
  debt observation's period year, falling back to the most recent
  population year at or before it — documented in the derivation file.
  Homepage shows an honest unavailable state, never €0, when population
  data is missing.
- Known gap: province/arrondissement aggregate rows (NIS codes like
  `10000`/`11000`) aren't mapped to entities yet and show up as
  unmapped — intentional, no `PROVINCE`/`DISTRICT` entities seeded yet.

## Phase 3a — public-finance dashboard (gov_10a_main / gov_10a_exp / gov_10a_taxag) — done

- Three new Eurostat adapters (`gov-10a-main-adapter.ts`, `gov-10a-exp-adapter.ts`,
  `gov-10a-taxag-adapter.ts`), all reusing the generic `DataSourceAdapter` /
  `runImport` pipeline. `gov_10a_main` gives TR/TE/B9/D41 (revenue,
  expenditure, net lending/borrowing, interest), in both `MIO_EUR` and
  Eurostat's own `PC_GDP` ratios (never manually derived). `gov_10a_exp`
  gives COFOG level-I (10 functions) S13 expenditure. `gov_10a_taxag` gives
  5 tax/social-contribution categories (D2, D211, D5, D61, D91), verified
  live before import (dataset code confirmed on 2026-09-19).
- `Observation`'s identity key doesn't include `unitId`, so `PC_GDP` variants
  of revenue/expenditure/net-lending got their own `*_pct_gdp` Metric rows
  instead of sharing a metric with `MIO_EUR` (would have silently collided).
- `import-runner.ts` gained classification-item support (previously
  hardcoded `classificationItemId: null` unconditionally) via a new
  `resolveClassificationItemId()` mapper, required for COFOG categories to
  import without collapsing into one row.
- `getLatestCommonAnnualPeriod()` (`src/data/derivations/latest-common-period.ts`)
  picks one shared year across revenue/expenditure/balance so the homepage
  overview never mixes years.
- `computeHundredEuroShares()` + `getHundredEuroExpenditure()` /
  `getHundredEuroRevenue()` (`src/data/derivations/`) power "Wat gebeurt er
  met €100?" — expenditure reconciled against `gov_10a_main` TE (not a sum
  of COFOG categories), revenue reconciled against TR with an explicit,
  surfaced residual ("Overige niet-fiscale ontvangsten") rather than a fake
  "other" bucket.
- Official debt/GDP ratio now sourced directly from `gov_10q_ggdebt`
  `PC_GDP` (never EUR-debt ÷ separately-sourced GDP).
- Homepage sections activated with real data: "België in één oogopslag"
  (now titled "— realisatie {year}", Tekort/Overschot-aware balance label),
  "Wat gebeurt er met €100?" (revenue + expenditure side by side), "Waar
  gaat het meeste geld naartoe?" (COFOG bar chart). Debt hero now shows a
  visible (not just popover) "Laatste officiële meting" line and the exact
  required "Geschatte actuele overheidsschuld" title.
- New i18n keys (`hundredEuro`, `cofog`) mirrored across nl/fr/de/en to
  satisfy the `Messages` type.
- Tests: COFOG adapter normalize + S13 consolidation guard (TOTAL
  pseudo-code never surfaces as a classification-coded observation),
  `computeHundredEuroShares` (sorting, no forced-100 rounding, no invented
  "other", positive-total guard). 57/57 tests green.
- Full validation pipeline green: Prisma validate, seed, all three new
  imports (0 rejected each), lint, typecheck, build. Rebuilt and redeployed
  the Docker image; verified live on `https://belgie.dakkofferverhuur.be`.

## Phase 4 — `/admin/data` internal data health dashboard — done

- Access control: HTTP Basic Auth via `src/middleware.ts` (matcher
  `/admin/:path*`), fails closed with 503 if `ADMIN_USERNAME`/
  `ADMIN_PASSWORD` aren't set, timing-safe credential comparison. Chosen
  deliberately over a full user-management system — this page has exactly
  one class of user (the operator/developer). `robots.txt` disallows
  `/admin`, and the admin layout additionally sets `robots: { index: false }`
  as defense in depth.
- Central, unit-tested health-rule module (`src/server/admin/dataset-health.ts`):
  `getDatasetHealth()` returns `HEALTHY | WARNING | STALE | FAILED |
  NEVER_IMPORTED` plus human-readable Dutch reasons, considering enabled
  state, last successful/attempted import, rejected records, and open
  unmapped values since the last success. `computeStaleness()` uses
  frequency-specific windows (MONTHLY 45d / QUARTERLY 120d / ANNUAL 400d,
  IRREGULAR never time-based) with a warning zone at 75% of the threshold —
  never one global "older than N hours" rule.
- Fixed a real pre-existing gap: `SourceDataset.lastCheckedAt`/
  `lastChangedAt` were defined in the schema but never written anywhere;
  `import-runner.ts` now updates both at the right points in the pipeline.
- Routes: overview (`/admin/data`), dataset table + filtering/sorting
  (`/admin/data/datasets`), dataset detail with stats, import history and a
  "Waar wordt deze dataset gebruikt?" section (`/admin/data/datasets/[id]`),
  import runs list + detail (`/admin/data/imports[/[id]]`), observation
  inspector with server-side filtering/pagination + detail
  (`/admin/data/observations[/[id]]`), revisions (`/admin/data/revisions`,
  explicitly framed as routine, never "errors"), unmapped values grouped by
  dataset/dimension/raw value with a "mark as reviewed" action that only
  sets `resolvedAt` — never deletes a row (`/admin/data/unmapped`), and
  actual failed/rejected import errors (`/admin/data/errors`).
- Manual "Check source" / "Run import" trigger on the dataset detail page
  (Server Actions), gated by an explicit `MANUALLY_TRIGGERABLE_DATASETS`
  allow-list mirroring the existing `scripts/import-*.ts` CLI scripts 1:1,
  with a running-import guard to prevent duplicate concurrent runs. Statbel
  population deliberately excluded (needs municipality provisioning + a
  large synchronous XLSX download; would need a job queue this app doesn't
  have yet — documented in `docs/ADMIN_DATA.md`).
- Read-only by design: no delete/edit/overwrite of observations anywhere in
  the admin UI. The only mutation is `resolvedAt` on unmapped values.
- Performance: every high-volume list (observations, import runs, revisions)
  is server-side filtered and paginated (`src/server/admin/pagination.ts`,
  max page size 200); the 34k-row unmapped-values table is aggregated with
  DB-level `groupBy()`, never loaded into the app.
- New Prisma indexes, each tied to a specific new admin query pattern:
  `Observation.sourceId`, `ObservationRevision.importRunId`,
  `ImportRun(datasetId, startedAt)`, `ImportRun.status`.
- Tests: `dataset-health.test.ts`, plus pure-function tests for pagination,
  the last-successful-run/last-attempt selection and import-error
  classification helpers, revision diff computation, observation filter
  building, and unmapped-group sorting — 46 new tests, all DB-mock-free
  (pure functions extracted out of the `server-only`-guarded query modules
  so they're directly testable), following the repo's existing no-DB-mock
  test style.
- Docs: `docs/ADMIN_DATA.md`.

## Phase 4a — NBB.Stat SDMX ingestion (`DF_NFGOV_DISS`) — done

- Generic, dataflow-agnostic NBB SDMX 2.1 ingestion layer:
  `NbbSdmxClient` (structure + CSV data endpoints), a regex-based SDMX
  structure/DSD/codelist parser, a dimension-agnostic Decimal-safe CSV
  parser, and `NbbDatasetAdapter` (implements the existing
  `DataSourceAdapter` contract, config-driven per dataflow).
- First (and, per this sprint's scope, only) dataflow imported:
  `DF_NFGOV_DISS` — annual S13/S1311/S1312/S1313/S1314
  revenue/expenditure/balance and 9 further verified metrics, 1995–2025,
  1,860 observations, 0 rejected.
- New entities `gemeenschappen-en-gewesten` (S1312) and `lokale-overheden`
  (S1313); `ExternalEntityIdentifier` scheme `NBB_SECTOR` resolves all five
  `GOVTYPE` codes (S1300/S1311/S1312/S1313/S1314).
- Reconciled against the existing Eurostat `gov_10a_main` import for S13
  2021–2023: 5/9 rows exact `MATCH`, 4/9 `ROUNDING_DIFFERENCE` (≤€0.2M on
  totals in the hundreds of billions of euro), 0 `INVESTIGATE`
  (`scripts/reconcile-nbb-eurostat.ts`).
- "Wie beheert het geld?" is no longer a placeholder: `/belgie#overheidsniveaus`
  now shows the four subsectors, gated on reconciliation passing (it does),
  with an explicit non-summation disclaimer (see `docs/CONSOLIDATION.md`);
  homepage links to it via a minimal CTA.
- Found and fixed during live integration: NBB's edge WAF serves an HTML
  error page with a misleading HTTP 200 to Node's global `fetch`; the client
  uses `node:https` instead (see `docs/NBB_IMPORT.md`).
- Docs: `docs/NBB_IMPORT.md`, `docs/GOVERNMENT_SUBSECTORS.md`,
  `docs/CONSOLIDATION.md`; `docs/NBB_DATA_DISCOVERY.md` updated with
  implementation status.
- Tests: 32 new (NBB adapter/client/parser/status-mapper, consolidation
  guard, reconciliation), 157/157 passing overall. `next build` clean.
- **Deliberately not done this sprint** (explicit stop, per instruction —
  needs a new go-ahead before proceeding): every other NBB dataflow
  (`DF_NFGOV_NET_DISS`, `DF_NFGOVQ_DISS`, `DF_NFGOVDETAIL_DISS`,
  `DF_NFGOVCOFOG_DISS`, `DF_NFGOVTSC_DISS`, `DF_NFGOVFR_DISS`,
  `DF_NFGOVISB_DISS`, `DF_CGD*`, `DF_FINGOV`), and NBB's `%GDP` unit variant
  of `DF_NFGOV_DISS` itself.

## Phase 4b — NBB.Stat SDMX ingestion (`DF_CGD`) — done

- Second NBB dataflow imported, per explicit go-ahead: `DF_CGD`
  (consolidated gross debt), quarterly, sectors S1300/S1311/S1312/S1313/
  S1314, 1998-Q4–2026-Q1, 550 observations, 0 rejected/unmapped.
- Generalised the generic `NbbDatasetConfig`/`NbbDatasetAdapter` (backward
  compatible, `DF_NFGOV_DISS` unaffected): optional unit dimension +
  `expectedUnitMultiplier`/`impliedUnitCode`, `additionalKeyDimensions`
  (pins `INSTRUMENT=F`), entity-conditional metric mapping
  (`NbbMetricMapping.entityCode`), and `parseNbbQuarterPeriod()`.
- Investigated (not assumed) whether the documented `CONTRIB*` item-code
  family works: it returns no data (HTTP 404 on every combination); `ITEM=CGD`
  per `GSECTOR` is the only working series and is what represents each
  subsector's "contribution to the total consolidated gross debt" in
  practice.
- New canonical metric `subsectorDebtContribution` (S1311–S1314), kept
  distinct from `government_debt` (S1300 only, same metric Eurostat
  `gov_10q_ggdebt` uses). Investigated (not assumed) whether S1311+S1312+
  S1313+S1314 sums to S1300 for this measure: it does not (~3.3% gap,
  23,438M EUR at 2026-Q1) — same non-summation pattern as revenue/
  expenditure/balance, verified independently against live data.
  `src/data/derivations/consolidation-guard.ts` regression-tests this with
  the real figures.
- Reconciled against Eurostat `gov_10q_ggdebt`, 2018-Q1–2026-Q1 (33
  quarters): **33/33 exact `MATCH`**, 0 `ROUNDING_DIFFERENCE`, 0
  `INVESTIGATE` (`scripts/reconcile-nbb-cgd-eurostat.ts`,
  `src/data/derivations/nbb-eurostat-debt-reconciliation.ts`).
- Query layer: `getGovernmentSectorDebtContributions(period?)`,
  `getGovernmentSectorDebtContributionHistory(sectorSlug)`
  (`src/server/queries/government-sectors.ts`).
- `/belgie#overheidsniveaus` extended with a "Bijdrage aan schuld" field per
  subsector card, a horizontal-bar comparison + S1300 total, a selectable
  quarterly history chart, and UI-safe copy that frames the figure as a
  *contribution* to the consolidated total rather than standalone subsector
  debt (`DEBT_CONTRIBUTION_METHODOLOGY_NOTE`,
  `DEBT_CONTRIBUTION_CONSOLIDATION_WARNING`,
  `src/server/queries/government-sectors-copy.ts`). No pie chart, per the
  non-summation finding.
- `DF_CGD` appears automatically in `/admin/data` — no dataset-specific
  admin UI needed.
- Docs: `docs/NBB_IMPORT.md`, `docs/GOVERNMENT_SUBSECTORS.md`,
  `docs/NBB_DATA_DISCOVERY.md` updated with implementation status.
- Tests: new adapter tests (`df-cgd.test.ts`), quarter-period-parsing tests,
  debt-reconciliation tests, consolidation-guard regression test, UI-safe
  terminology tests — 173/173 passing overall. `next build` clean.
- Docker `web` service rebuilt/redeployed in isolation; `/`, `/belgie`,
  `/admin/data` verified live with the new content; `db`/Caddy untouched.
- **Deliberately not done this sprint** (per instruction — needs a new
  go-ahead): `DF_CGDS1312`/`DF_CGDS1313` (per-region/community debt
  breakdown within S1312/S1313).

## Phase 3b — not started

1. Documentation set: `docs/DATA_ARCHITECTURE.md`, `ENTITY_MODEL.md`,
   `SOURCE_REGISTRY.md`, `OBSERVATIONS.md`, `REVISIONS.md`,
   `COMPARABILITY.md`, `DATA_IMPORTS.md`, `MUNICIPAL_MERGERS.md`
   (`CONSOLIDATION.md` now exists, written as part of Phase 4a).
2. Named history query functions (`getBelgiumRevenueHistory` /
   `getBelgiumExpenditureHistory` / `getBelgiumBalanceHistory` /
   `getBelgiumCofogHistory` exist in `src/server/queries/finance.ts` but
   aren't wired into any UI yet) — homepage history-section metric switcher
   (Schuld/BBP, Schuld €, Inkomsten, Uitgaven, Saldo) still to build.
3. COFOG level-II detail, personal/corporate income tax split in the UI
   (`taxes_income_personal` / `taxes_income_corporate` metrics exist,
   unused in the UI so far).
4. Flanders/Wallonia/Brussels local finance adapters — investigate stable
   machine-readable sources first, no HTML scraping.
5. Municipality search (population data is now in place; needs regional
   local-finance data too for per-municipality financial detail).
6. `GlobalSearch` (Cmd/Ctrl+K), mobile nav drawer, dark-mode toggle UI.
7. Scheduled/cron import jobs (currently manual `npm run import:*` /
   `npm run estimate:debt`), and revisit ISR once build has DB access — the
   admin dashboard's manual-trigger feature covers ad hoc runs for the
   Eurostat/Statbel/NBB datasets in the meantime.
8. Remaining NBB.Stat dataflows (see Phase 4a/4b's "deliberately not done"
   lists) — pending explicit go-ahead to expand beyond `DF_NFGOV_DISS`/
   `DF_CGD`.
