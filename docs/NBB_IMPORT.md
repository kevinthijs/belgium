# NBB.Stat import (`DF_NFGOV_DISS`, `DF_CGD`)

## Source

- Live SDMX 2.1 REST API: `https://nsidisseminate-stat.nbb.be/rest`, agency `BE2`.
- The legacy `stat.nbb.be/RestSDMX` endpoint is dead — never use it.
- Structure (dataflow + DSD + all referenced codelists in one call):
  `GET /rest/dataflow/BE2/{dataflowId}?references=all`
  (`application/vnd.sdmx.structure+xml; version=2.1`).
- Data: `GET /rest/data/BE2,{dataflowId},{version}/{key}?format=csv`
  (`text/csv`), where `{key}` is the DSD's dimension values joined by `.` in
  DSD `position` order, with `+` joining multiple codes within one dimension
  and an empty segment wildcarding a dimension.
- `DF_NFGOV_DISS`: annual (`FREQ=A`), non-financial accounts of general
  government, sectors S13/S1311/S1312/S1313/S1314, 1995–present.
- `DF_CGD`: quarterly (`FREQ=Q`), consolidated gross debt (Maastricht-style),
  sectors S1300/S1311/S1312/S1313/S1314, 1998-Q4–present.

See `docs/NBB_DATA_DISCOVERY.md` for the full discovery notes (all 16
dataflows, dimensions/codelists, reconciliation groundwork).

## Architecture (generic, not `DF_NFGOV_DISS`-specific)

- `src/data/adapters/nbb/sdmx-types.ts` — SDMX 2.1 structure model + regex
  XML parsing (dataflow, DSD/dimensions in `position` order, codelists).
- `src/data/adapters/nbb/client.ts` — `NbbSdmxClient`, generic HTTP client.
  Requests are made with Node's `https` module, **not** the global `fetch`
  (undici) — NBB's edge WAF (F5 ASM) fingerprints the TLS/HTTP client and
  serves an HTML `Error/NotAvailable.aspx` redirect page with a *misleading
  HTTP 200* to `fetch()` requests, confirmed during live testing (the same
  URL succeeds via `curl` and via `node:https`). The client also defensively
  checks response bodies against that WAF page even on a 200, since status
  code alone cannot be trusted here.
- `src/data/adapters/nbb/csv-parser.ts` — `NbbCsvParser`, dimension-agnostic
  SDMX-CSV parsing, Decimal-safe value extraction with `UNIT_MULT` rescaling.
- `src/data/adapters/nbb/status-mapper.ts` — `OBS_STATUS` → canonical
  `ObservationStatus`, annual `TIME_PERIOD` parsing.
- `src/data/adapters/nbb/dataset-adapter.ts` — `NbbDatasetAdapter`, generic
  and config-driven (`NbbDatasetConfig`). Discovers dimension order live from
  the DSD on every fetch rather than hardcoding it, since different NBB
  dataflows are not guaranteed to share dimension order.
- `src/data/adapters/nbb/df-nfgov-diss.ts` / `df-cgd.ts` — the
  dataflow-specific files: `*_CONFIG` and `*_METRIC_MAPPINGS` per dataflow.

A new NBB dataflow should normally only need a new config file like
`df-nfgov-diss.ts`, not a new adapter class. Adding `DF_CGD` required two
small, backward-compatible generalisations of `NbbDatasetConfig`/
`NbbDatasetAdapter` (both still exercised unchanged by `DF_NFGOV_DISS`):

- `unitDimension`/`unitCodes` became optional, with an `expectedUnitMultiplier`
  + `impliedUnitCode` pair covering dataflows (like `DF_CGD`) that have no
  separate `UNIT` dimension — unit is conveyed only via the `UNIT_MULT` CSV
  attribute.
- `additionalKeyDimensions` lets a config constrain extra structural
  dimensions beyond entity/metric/unit/frequency (`DF_CGD` uses this to pin
  `INSTRUMENT=F`, the all-instruments aggregate).
- `NbbMetricMapping.entityCode` lets the same source `ITEM` code map to a
  *different* canonical `Metric.code` depending on which entity reports it
  — needed because `DF_CGD`'s `ITEM=CGD` means `government_debt` for the
  whole-government total (`GSECTOR=S1300`) but `subsectorDebtContribution`
  for the four subsectors.
- `parseNbbQuarterPeriod()` (`status-mapper.ts`) parses `YYYY-Qn` periods;
  the adapter dispatches to it instead of `parseNbbAnnualPeriod()` whenever
  `config.frequencyCode === "Q"`.

## Metric mapping

Only NBB `ITEM` codes with a confirmed live English description (verified in
`docs/NBB_DATA_DISCOVERY.md`'s live-data sampling) are mapped — never from a
human-readable label alone:

| ITEM     | Metric.code                    | ESA transaction (provenance only) |
|----------|---------------------------------|------------------------------------|
| `TOR`    | `government_revenue`            | —                                   |
| `TOE`    | `government_expenditure`        | —                                   |
| `DEF`    | `net_lending_borrowing`         | B.9                                 |
| `COE`    | `compensation_of_employees`     | D.1                                 |
| `INT_C`  | `interest_expenditure`          | D.41                                |
| `INT_R`  | `interest_received`             | D.41                                |
| `ITX`    | `taxes_production_imports`      | D.2                                 |
| `DTX`    | `taxes_income`                  | D.5                                 |
| `SCA`    | `social_contributions`          | D.61                                |
| `SCI`    | `imputed_social_contributions`  | D.612                               |
| `INV`    | `gross_fixed_capital_formation` | P.51g                               |
| `GSV`    | `gross_saving`                  | B.8g                                |

Codes without a confirmed description (`CAO, CSG, CTE, CUO, KEX, KTX, OPI,
PDF`, the `1Cx`/`1Ix`/`1Ox`/`1SB` family) are deliberately not mapped this
sprint — they are simply never requested, so they never show up as
"unmapped" noise in `/admin/data/unmapped`.

Only `UNIT=E` (EUR millions) is imported this sprint; `%GDP` (`UNIT=P`) is
explicitly deferred.

## Entities

`ExternalEntityIdentifier` scheme `NBB_SECTOR` resolves NBB `GOVTYPE` codes
to `GovernmentEntity` rows:

| GOVTYPE | Entity slug                   |
|---------|--------------------------------|
| S1300   | `belgie`                       |
| S1311   | `federale-overheid`            |
| S1312   | `gemeenschappen-en-gewesten`   |
| S1313   | `lokale-overheden`             |
| S1314   | `sociale-zekerheid`            |

S1312/S1313 are pure statistical aggregates (no single administrative body),
tagged `entityType: GENERAL_GOVERNMENT` — the same enum value already used
for `eu27`.

## Running the import

```bash
npm run import:nbb:nfgov-diss
```

Uses the shared `runImport()` pipeline (`src/data/import/runner/import-runner.ts`)
unmodified. Import scope is explicit: only the configured entity/item/unit
codes are ever requested from NBB (filtered by construction, not rejected
after the fact).

## Reconciliation against Eurostat

```bash
npx tsx scripts/reconcile-nbb-eurostat.ts
```

Compares NBB S13 (entity `belgie`) revenue/expenditure/net lending-borrowing
against the existing Eurostat `gov_10a_main` import for 2021–2023, classifying
each row as `MATCH` (≤€0.05M), `ROUNDING_DIFFERENCE` (≤€0.5M),
`REVISION_TIMING_DIFFERENCE`/`DEFINITION_DIFFERENCE` (reserved, not currently
produced), or `INVESTIGATE`. Logic lives in
`src/data/derivations/nbb-eurostat-reconciliation.ts`
(`reconcileNbbAgainstEurostat`, `reconciliationPasses`).

Result as of the initial import: 5/9 rows `MATCH` exactly, 4/9
`ROUNDING_DIFFERENCE` (≤€0.2M on totals in the hundreds of billions of
euro), 0 `INVESTIGATE` — reconciliation passes.

## Source precedence

NBB is a second, independent source for S13 alongside Eurostat — it is never
used to overwrite Eurostat observations, and the platform's default
"official" source for Belgium's headline S13 figures is not silently
switched. NBB's value here is the S1311–S1314 subsector breakdown, which
Eurostat's `gov_10a_main` does not publish. See `docs/GOVERNMENT_SUBSECTORS.md`.

## `DF_CGD` — consolidated gross debt / subsector contribution

### Item-code investigation

`CL_CGD_ITEM` documents a `CONTRIB`/`CONTRIB_S1300`/`CONTRIB_S1311`/...
family of codes literally named "p.m. Contribution of the subsector to the
total consolidated gross debt" — but every dimension-key combination tried
against those codes returns NBB HTTP 404 (no data published under them).
The only item code that returns data is `CGD` ("Consolidated gross debt"),
queried per `GSECTOR`. This is therefore the working data source: each
subsector's own consolidated `GSECTOR`-scoped `CGD` figure, read alongside
the `GSECTOR=S1300` whole-government total, is what represents "contribution
to the total consolidated gross debt" in practice — not a literal `CONTRIB`
series. `INSTRUMENT=F` selects the all-instruments aggregate.

### Metric mapping

| GSECTOR | ITEM  | Metric.code                    |
|---------|-------|---------------------------------|
| S1300   | `CGD` | `government_debt` (same canonical metric as Eurostat `gov_10q_ggdebt`) |
| S1311   | `CGD` | `subsectorDebtContribution`     |
| S1312   | `CGD` | `subsectorDebtContribution`     |
| S1313   | `CGD` | `subsectorDebtContribution`     |
| S1314   | `CGD` | `subsectorDebtContribution`     |

`subsectorDebtContribution` is a deliberately distinct metric from
`government_debt` — see docs/GOVERNMENT_SUBSECTORS.md for why the four
subsector figures do not sum to the S1300 total.

### Coverage

Quarterly (`FREQ=Q`), confirmed live 1998-Q4 through 2026-Q1 (110
observations per sector, uniform across S1300/S1311/S1312/S1313/S1314) —
not the 1995–present annual range of `DF_NFGOV_DISS`, a different dataflow.

### Running the import

```bash
npm run import:nbb:cgd
```

Production run: 550 observations received/created (5 sectors × 110
quarters), 0 updated, 0 unchanged, 0 rejected, 0 filtered, 0 unmapped
values.

### Reconciliation against Eurostat

```bash
npx tsx scripts/reconcile-nbb-cgd-eurostat.ts
```

Compares NBB `DF_CGD` S1300 (`government_debt`, entity `belgie`) against
Eurostat `gov_10q_ggdebt` for every quarter 2018-Q1–2026-Q1 (33 quarters).
Both dataflows are genuinely quarterly, so this is a direct year+quarter
match — no annual-vs-Q4 approximation needed. Logic lives in
`src/data/derivations/nbb-eurostat-debt-reconciliation.ts`
(`reconcileNbbDebtAgainstEurostat`, `debtReconciliationPasses`).

Result: **33/33 rows exact `MATCH`** (difference = 0 in every quarter),
0 `ROUNDING_DIFFERENCE`, 0 `INVESTIGATE` — reconciliation passes cleanly.
