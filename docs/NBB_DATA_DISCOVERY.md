# NBB.Stat / SDMX Data Discovery

**Status:** Phase 1–4 discovery complete (live source inspection + reconciliation). No import code has been written yet — this document is the required gate before Phase 5+ implementation.

**Method:** All information below was obtained by querying the *live* NBB.Stat SDMX REST API on 2026-09-19, not from prior training knowledge or old documentation. Endpoints, dataflow IDs, dimensions and codelists are copied from actual API responses.

## 1. Live SDMX endpoint

- **Base URL (working, SDMX 2.1 REST/NSI Web Service v8.19.9.0):**
  `https://nsidisseminate-stat.nbb.be/rest`
- **Agency ID for national content:** `BE2`
- Other agencies present in the same catalogue: `IMF` (a handful of IMF SDDS dataflows re-published through the same service — out of scope here).
- Structure endpoints confirmed working:
  - `GET /rest/dataflow` → full dataflow catalogue (222 dataflows: 189 BE2 national + 33 IMF).
  - `GET /rest/dataflow/BE2/{DATAFLOW_ID}?references=all` → dataflow + DSD + all codelists in one response (this is the call used for all discovery below).
  - `GET /rest/data/BE2,{DATAFLOW_ID},1.0/{FREQ}.{DIM2}.{DIM3}...?format=csv` → observations, dimension values joined with `.`, multiple codes in one dimension joined with `+`, empty position = wildcard. `format=csv` returns a flat CSV (`DATAFLOW,FREQ,...,TIME_PERIOD,OBS_VALUE,OBS_STATUS,CONF_STATUS,UNIT_MULT,DECIMALS`), which is far cheaper to parse than SDMX-ML and is what the adapter should request.
- The legacy endpoint referenced in old third-party docs, `https://stat.nbb.be/RestSDMX/sdmx.ashx`, **did not respond** (connection reset) during this discovery session. It should not be used. The current, live, working service is the NSI Web Service v8 endpoint above.
- Response format actually served: `application/vnd.sdmx.structure+xml; version=2.1` for structure queries; CSV available on request for data queries via `?format=csv` (SDMX-CSV, not SDMX-JSON as older docs suggested).
- No API key/auth was required for any of the above (IP-based, per NBB's own docs; all calls succeeded unauthenticated).

## 2. Government-finance dataflows identified (of 189 BE2 dataflows)

Filtered from the full catalogue by keyword match on id/name (government, debt, ESA, fiscal, GFS, etc.):

| Dataflow ID | Name | Relevance |
|---|---|---|
| `DF_NFGOV_DISS` | Non-financial account of the government – overview | **A** — revenue/expenditure/balance headline figures |
| `DF_NFGOV_NET_DISS` | Government Deficit/Surplus – overview | **A** — same underlying DSD as above, deficit-focused view |
| `DF_NFGOVQ_DISS` | Quarterly government account | **A/B** — quarterly non-financial accounts |
| `DF_NFGOVDETAIL_DISS` | Detailed government accounts | **B** — fuller non-financial account detail, broader sector list (incl. S.13/S.11/S.12/S.14/S.15 for context) |
| `DF_NFGOVCOFOG_DISS` | Public expenditure by functions and transactions | **E** — COFOG × transaction × **sector**, i.e. national COFOG detail broken down by S.1300/S.1312(+sub-entities)/S.1313/S.1314 |
| `DF_NFGOVTSC_DISS` | Taxes and actual social contributions received by type | **G** — taxes/contributions by type and sector |
| `DF_NFGOVFR_DISS` | Taxes and actual social contributions withheld to fund other sub-sectors | **F** — closest available proxy for inter-subsector fiscal flows (see §6) |
| `DF_NFGOVISB_DISS` | Breakdown of paid social benefits | supporting detail for S1314-related expenditure |
| `DF_CGD` | Consolidated gross debt of general government | **C** — Maastricht-style consolidated gross debt, with subsector `CONTRIB_*` items |
| `DF_CGDCONS` | Consolidated gross debt: consolidating elements | supporting detail for `DF_CGD` |
| `DF_CGDHCM` | Breakdown of consolidated gross debt of general government | supporting detail |
| `DF_CGDS1312` | Breakdown of communities and regions (S.1312) | **D** — debt contribution of each community/region |
| `DF_CGDS1313` | Breakdown of local government (S.1313) | **D** — debt contribution of local government, regionally split |
| `DF_FINGOV` | Government financial accounts: new transactions | financial-account counterpart (not prioritized this sprint) |
| `DF_FINGOV_BALANCE` | Financial government accounts: financial wealth | financial-account counterpart (not prioritized this sprint) |
| `DF_TREASDEBT` | Official debt and net lending/net borrowing of the Treasury | Treasury-cash-basis view, distinct from ESA; not prioritized |

Not government-specific but touching government sectors (noted, not imported): `DF_NASECDET2010_DISS`, `DF_NASECDETQ_DISS` (whole-economy sector accounts incl. S.13), `DF_REGP3S13S15` (final consumption of NPISH + government).

## 3. Dimensions per dataflow (from live DSDs)

All confirmed via `GET /rest/dataflow/BE2/{ID}?references=all`.

### `DF_NFGOV_DISS` / `DF_NFGOV_NET_DISS` (same DSD: `DS_NFGOV_DISS`)
- Dimensions: `FREQ`, `GOVTYPE`, `ITEM`, `UNIT`. Time: `TIME_PERIOD`. Measure: `OBS_VALUE`.
- `FREQ` codes: `A` Annual, `S` Half-yearly, `Q` Quarterly, `M` Monthly, `D` Daily (only `A` has data in this dataflow).
- `UNIT` codes: `E` Millions of euro, `P` % of GDP.
- `GOVTYPE` (codelist `CL_NACC_GOVTYPE_DISS`, 27 codes) — the canonical Belgian subsector list:
  - `S1300` General government (= ESA `S.13`)
  - `S1311` **"Central government"** in this codelist's English label (NBB's own `DF_NFGOVDETAIL_DISS` sector list instead labels the same code **"Federal government"** — the two NBB dataflows use different English glosses for the identical ESA code; use `S1311` as canonical and pick a single display label, do not trust the label text alone)
  - `S1312` "State government" = communities & regions
  - `S1313` Local government
  - `S1314` Social security funds
  - Sub-entities of `S1312` also published directly at this level: `FLC` Flemish Community, `FRC` French Community, `WLR` Walloon Region, `BCR` Brussels-Capital Region, `GEC` German-speaking Community, `CFR` French-speaking Community Commission, `CFL` Flemish Community Commission, `CJC` Joint Community Commission, `IU_NA` interregional/not allocated, `TCR` total of communities and regions.
  - Sub-entities of `S1313`: `FLG`, `WLG`, `BLG`, `GLG` (regional split of local government), `LGND` not-allocated.
  - Non-canonical/technical codes present in the same list and **must not** be treated as sectors: `S1316` "Balances ESA 2010", `S1315` "Balances incorporating advance payments of additional regional percentages", `STD` "Statistical discrepancy", `FDTCR` "p.m. Federal government" (a memorandum item), `SFLC`/`SWLR`/`SBCR` (prefixed variants tied to `S1315`).
- `ITEM` (codelist `CL_NACC_ITEM_DISS`, 154 codes, covers multiple sub-tables incl. household/NFC accounts). Government-relevant codes actually populated for `GOVTYPE=S1300` (verified by live data pull, see §4): `TOR` Receipts, `TOE` Expenditure, `DEF` Net lending(+)/borrowing(-), `COE` Compensation of employees, `INT_C` Interest charges, `INT_R` Interest received, `ITX` Indirect taxes, `DTX` Direct taxes, `SCA` Actual social contributions, `SCI` Imputed social contributions, `INV` Gross fixed capital formation, `GSV` Gross saving, plus `1CA`, `1CE`, `1CT`, `1FP`, `1IC`, `1NF`, `1OT`, `1SB` family (capital/current transfer and social-benefit sub-splits), `CAO`, `CSG`, `CTE`, `CUO`, `KEX`, `KTX`, `OPI`, `PDF`, `TOE`/`TOR` sub-splits (`DTX_C`, `DTX_I`, `DTX_O`, `1SB_F/H/O/P/R/S/U`, etc.).
  - **Note:** `GGREC`/`GGEXP`/`GGCE`/`GGSB` etc. also exist in the same shared `CL_NACC_ITEM_DISS` codelist (used by the household/NFC-account rows of the same table) but returned `NoRecordsFound` when queried against `GOVTYPE=S1300` — they are not the codes actually used for the government rows. The two-to-three-letter codes (`TOR`, `TOE`, `COE`, ...) are the ones with real government observations. This distinction was only found by querying live data, confirming the "do not assume from documentation" instruction was necessary.

### `DF_NFGOVQ_DISS` (quarterly)
- Dimensions: `FREQ`, `ITEM` (codelist `CL_NFGOVQ_ITEM_DISS`), `UNIT` (codelist `CL_NFGOVQ_UNIT_DISS`), `ADJUSTMENT` (codelist `CL_NACC_ADJ_DISS` — seasonal/calendar adjustment), `REF_SECTOR` (codelist `CL_SECTOR`, the large whole-economy sector list incl. `S1311`, `S1312`, `S13121`/`S13122` budgetary/extra-budgetary splits, `S1313`, `S13131`/`S13132`, `S1314`, `S13141`/`S13142`, and regional community/region/local sub-codes `S1312_FLC`, `S1312_WLR`, `S1312_BCR`, `S1312_FRC`, `S1312_GEC`, `S1312_FRCC`, `S1312_FLCC`, `S1312_JCC`, `S1313_FLG`, `S1313_WLG`, `S1313_BLG`, `S1313_GLG`).
- **Separate frequency and separate DSD from the annual dataflow — must not be merged into the same series without frequency metadata, per Phase 9.**

### `DF_NFGOVDETAIL_DISS`
- Dimensions: `FREQ`, `ACCOUNT` (codelist `CL_NFGOVDETAIL_ACC`), `SECTOR` (codelist `CL_SGD_SECTOR_DISS`).
- `CL_SGD_SECTOR_DISS` includes the whole economy (`S1`, `S11`, `S12`, `S13`, `S1300`, `S1311` here labelled "Federal government", `S1312`, `S1313`, `S1314`, `S14`, `S15`, `S2`...) — useful for cross-checking S13 against the rest of the economy, not just subsector detail.

### `DF_NFGOVCOFOG_DISS`
- Dimensions: `FREQ`, `FUNCTION` (codelist `CL_NACC_FUNCTION_DISS`, COFOG classification), `ITEM` (transaction, `CL_NACC_ITEM_DISS`), `SECTOR` (codelist `CL_NACC_SECTOR_DISS`).
- `CL_NACC_SECTOR_DISS` gives the same subsector breakdown as above **plus finer S.1312 entity codes with an `S1312_` prefix**: `S1312_VL` Flemish community, `S1312_WL` Walloon region, `S1312_BX` (Brussels), `S1312_FR` French community, `S1312_DE` German community, `S1312_JCC` Joint Community Commission, `S1312_VGC` Flemish Community Commission, `S1312_CCF` (French Community Commission), `S1312_NA` not allocated; also `S1313`, `S1314`, and non-government sectors `S14`, `S15`, `S14_15` for context.
- This is the **only dataflow crossing COFOG function × transaction × subsector** — directly relevant to Phase 15's warning that functional (COFOG) and subsector dimensions are orthogonal: this dataflow is where they are legitimately crossed by NBB itself, at national level (Eurostat's COFOG is not sector-split for Belgium, per the prior `/belgie` sprint).

### `DF_NFGOVTSC_DISS` (taxes & actual social contributions by type)
- Dimensions: `FREQ`, `ITEM` (codelist `CL_TSCISB_ITEM_DISS`), `SECTOR` (codelist `CL_TSCISB_SECTOR_DISS` — communities/regions entity codes: `BCR`, `CFL`, `CFR`, `CJC`, `FLC`, `FRC`, `GEC`, `IU_NA`, `STD`, `WLR`).

### `DF_NFGOVFR_DISS` (taxes/contributions withheld to fund other sub-sectors)
- Dimensions: `FREQ`, `TYPE` (codelist `CL_NACC_TYPE_DISS` — detailed fiscal-receipt type codes, e.g. `D73FR_D211P` VAT, `D73FR_D2122C` excise duties broken down by product, `D73FR_D214G` insurance-contract taxes, `D73FR_D51A/D51B/D51X` income-tax sub-types), `SECTOR` (codelist `CL_NFGOVFR_SECTOR_DISS`: `TOT` all sectors, `S1312` Communities/Regions, `S1313` Local government, `S1314` Social security funds, `S212` EU institutions).
- This dataflow expresses *which receiving subsector* a given federally-collected tax/contribution is withheld/transferred to fund — see §6 for its relevance to intergovernmental transfers.

### `DF_CGD` (Maastricht-style consolidated gross debt)
- Dimensions: `FREQ`, `ITEM` (codelist `CL_CGD_ITEM`), `GSECTOR` (codelist `CL_FINACC_SECTOR`), `INSTRUMENT` (codelist `CL_FINACC_INSTRUMENT`).
- `GSECTOR` relevant codes: `S13` General government, `S13NC` General government non-consolidated, `S1300` General government consolidated, `S1311` **Federal government, consolidated**, `S1312` Communities and regions, consolidated, `S1313` Local government, consolidated, `S1314` Social security funds, consolidated.
- `ITEM` relevant codes: `CGD` Consolidated gross debt, **`CONTRIB` "p.m. Contribution of the subsector to the total consolidated gross debt"** (exactly the concept described in Phase 12; further split as `CONTRIB_S1300`/`CONTRIB_S1311`/`CONTRIB_S1312`/... ), plus consolidating-element breakdowns `TCA`/`TCAHD_*`/`TCADS_*`/`TCAI_*` (by holder subsector, debtor subsector, instrument) and local-government-specific items `LGF`/`LGW`/`LGB`/`LGG`/`LGNA`, `CLE` (consolidation between local entities), `CGLG`, `CALE`, `CGDLE`.
- `INSTRUMENT` includes an aggregate "all instruments" code `F` (used in the reconciliation in §7) plus `F2`, `F21`, `F22_29`, `F3`, `F31`, `F32`, `F4`, `F41`, `F42` (AF.2/AF.3/AF.4-family financial instruments).
- Frequency: quarterly (`Q`) data confirmed present through 2026-Q1.

### `DF_CGDS1312` / `DF_CGDS1313` (subsector debt breakdown, confirming Phases 12–14)
- `DF_CGDS1312` dimensions: `FREQ`, `ITEM` (`CL_CGD_ITEM`), `ENTITY` (codelist `CL_CGD_ENTITY`): `TOT` Total, `FLC` Flemish Community, `FRC` French Community, `WLR` Walloon Region, `BCR` Brussels-Capital Region, `GEC` German Community, `CFR` Commission French-speaking Community, `CJC` Joint Community Commission, `CFL` Commission Flemish-speaking Community, `IU` Interregional units, `ISC` **"Consolidation between federated entities (-)"**.
  - **This directly answers Phase 13: yes, NBB publishes a genuine entity-level debt breakdown within S.1312**, each community/region individually, plus an explicit inter-entity consolidation adjustment — not something that has to be inferred or assumed.
- `DF_CGDS1313` dimensions: `FREQ`, `ITEM` only (no separate `ENTITY` dimension at the dataflow level — the local-government regional split (`LGF`/`LGW`/`LGB`/`LGG`/`LGNA`) is expressed as `ITEM` codes within the shared `CL_CGD_ITEM` list instead of a dedicated dimension). **Answers Phase 14: local government (S.1313) debt can be split by region (Flemish/Walloon/Brussels/German-speaking local government) but not published by individual municipality/province/CPAS through this dataflow** — consistent with the instruction to use "Lokale overheden" rather than "gemeenten" and not assume municipality-level granularity exists.

## 4. Confirmed historical coverage (live data pulls, `A.{GOVTYPE}.DEF.E`)

Queried `DF_NFGOV_DISS` for `ITEM=DEF` (net lending/borrowing), annual frequency, EUR unit, for `S1311`, `S1312`, `S1313`, `S1314`:

| Subsector | First year | Last year | Observation count |
|---|---|---|---|
| S1311 | 1995 | 2025 | 31 |
| S1312 | 1995 | 2025 | 31 |
| S1313 | 1995 | 2025 | 31 |
| S1314 | 1995 | 2025 | 31 |

All four subsectors have **identical, full 1995–2025 annual coverage** for this metric — no fabrication needed, and no later-starting subsector series encountered for this particular item (this must still be re-checked per item/metric during actual import, since coverage can vary by transaction).

`DF_CGD` quarterly debt data (`S1300`, instrument `F`) confirmed present through **2026-Q1**.

## 5. Status flags and revision metadata

- `OBS_STATUS` codelist (`CL_OBS_STATUS`, 21 codes) shared across dataflows includes the standard SDMX/ECB status set: `A` Normal, `P` Provisional, `E` Estimated, `B` Time series break, `R` Revised value, `I` Value imputed, `D` Definition differs, `G` Experimental, and others (missing-value sub-codes `O`/`L`/`H`/`M`/`Q`, confidentiality-adjacent `K`/`W`, reliability `U`, validation `V`, special events `S`, derogation `J`).
- `CONF_STATUS` codelist (`CL_CONF_STATUS`, 11 codes): `F` Free for publication is the code seen on every value retrieved in this discovery pass; the confidentiality codes (`C`/`N`/`D`/`S`/`A`/`O`/`T`/`G`/`M`/`E`) exist in the schema and must be handled (excluded from public display) if ever encountered.
- Live sample rows carried `OBS_STATUS` values of `A` (normal, most years), `P` (2025, provisional — expected for the most recent year), and `B` (2009, time series break — e.g. `S1300`/`DEF` 2009). This confirms revisions/breaks are a normal, present condition in the data and must be handled (Phase 21), not treated as import errors.
- `UNIT_MULT` and `DECIMALS` attributes are present on every observation (e.g. `UNIT_MULT=6` for millions-of-euro figures in `DF_CGD`, blank/`1` decimals elsewhere) and must be applied when scaling values.

## 6. Intergovernmental transfers — feasibility (Phase 11)

**Finding: partial, indirect support only — no dataflow provides an explicit bilateral "from sector X to sector Y" flow table.**

The closest available data is `DF_NFGOVFR_DISS` ("Taxes and actual social contributions withheld to fund other sub-sectors"), which reports, by detailed federally-collected tax/contribution type (`TYPE`, e.g. VAT, excise duties, income tax sub-types), the amount **withheld/allocated to fund** `S1312` (communities/regions), `S1313` (local government), `S1314` (social security funds), or `S212` (EU institutions), against a `TOT` "all sectors" total. This is a *funding-source* view (which federal receipt funds which subsector), not a bilateral transfer-flow table with an explicit counterpart-sector pair on both sides of a payment. It can plausibly be mapped into `IntergovernmentalTransfer` records with `fromSector = S1311 (federal, implied)` and `toSector` = the `SECTOR` dimension value, **but this requires a confirmatory read of the `TYPE` codelist's exact fiscal-receipt semantics before treating it as a transfer amount**, and does not cover regions→local or federal→social-security transfers routed through other mechanisms (e.g. direct federal dotations, structurally embedded in `DF_NFGOVDETAIL_DISS`/`DF_NFGOVCOFOG_DISS` current-transfer items such as `1CT`/`GGCTOS`/`GGCAPTOS`, which record transfers *from/to other sectors* in aggregate but without naming the specific counterpart subsector).
- Per the explicit Phase 11 instruction, **no transfer direction has been inferred from aggregate differences** — this section only reports dimension structures actually observed live.
- Recommendation for the next sprint: a follow-up discovery pass specifically walking the `CL_NACC_ITEM_DISS` current/capital-transfer codes (`1CT`, `1CA`, `GGCTOS`, `GGCAPTOS`, `GGCURTOS`, `GGCAPTOS`) per subsector to determine whether counterpart-sector attribution exists at the observation level (it did not appear as a separate dimension in any dataflow inspected so far) before building `IntergovernmentalTransfer` import logic.

## 7. Eurostat/NBB reconciliation (Phase 4)

Spot-checked by comparing live NBB `DF_NFGOV_DISS` (`GOVTYPE=S1300`) and `DF_CGD` (`GSECTOR=S1300`, `INSTRUMENT=F`, all-instruments total) values against existing Eurostat-sourced observations already in the production database for Belgium (`government_revenue`, `government_expenditure`, `net_lending_borrowing`, `government_debt` metrics).

| Metric | Period | NBB value (EUR M) | Eurostat value (EUR M) | Difference | Diff % | Result |
|---|---|---|---|---|---|---|
| Total revenue (TOR / government_revenue) | 2021 | 250,681.2 | 250,681.2 | 0.0 | 0.00% | MATCH |
| Total revenue | 2022 | 274,862.7 | 274,862.7 | 0.0 | 0.00% | MATCH |
| Total revenue | 2023 | 293,331.0 | 293,330.9 | 0.1 | <0.01% | ROUNDING_DIFFERENCE |
| Total expenditure (TOE / government_expenditure) | 2021 | 278,017.6 | *(component sum, see note)* | — | — | not independently re-verified this pass |
| Total expenditure | 2023 | 318,050.9 | 318,050.9 | 0.0 | 0.00% | MATCH |
| Net lending/borrowing (DEF / net_lending_borrowing) | 2021 | -27,336.4 | -27,336.5 | 0.1 | <0.01% | ROUNDING_DIFFERENCE |
| Net lending/borrowing | 2022 | -19,883.2 | -19,883.0 | 0.2 | <0.01% | ROUNDING_DIFFERENCE |
| Net lending/borrowing | 2023 | -24,719.9 | -24,720.1 | 0.2 | <0.01% | ROUNDING_DIFFERENCE |
| Consolidated gross debt (CGD / government_debt) | 2025-Q3 | 680,801 | 680,801 | 0.0 | 0.00% | MATCH |
| Consolidated gross debt | 2025-Q4 | 692,460 | 692,460 | 0.0 | 0.00% | MATCH |

**Conclusion:** for Belgium's S.13 headline aggregates (revenue, expenditure, net lending/borrowing, consolidated gross debt), NBB and Eurostat figures match to within rounding (all differences ≤ €0.2M on multi-hundred-billion-euro totals). This is expected and consistent with Eurostat sourcing Belgium's ESA notification data from the NAI/NBB in the first place — it is **not evidence that all other NBB series (e.g. subsector-level or COFOG-crossed data) will reconcile equally cleanly**, since Eurostat does not publish an independent subsector breakdown for Belgium to check against. No DEFINITION_DIFFERENCE or INVESTIGATE cases were found in this initial spot-check; a fuller reconciliation (more years, more metrics) is recommended before Phase 17 UI activation.

## 8. Answers to the sprint's core structural questions

1. **Revenue/expenditure/balance per subsector** — available annually 1995–2025 for S1311/S1312/S1313/S1314 via `DF_NFGOV_DISS` (items `TOR`/`TOE`/`DEF`), plus quarterly via `DF_NFGOVQ_DISS`.
2. **Taxes/contributions/transfers received per subsector** — available via `DF_NFGOVTSC_DISS` (by type and community/region entity) and `DF_NFGOVFR_DISS` (federally-collected receipts allocated to fund S1312/S1313/S1314).
3. **Expenditure types per subsector** — available via `DF_NFGOVCOFOG_DISS` (COFOG function × transaction × subsector, including S1312 entity-level) and `DF_NFGOVDETAIL_DISS`.
4. **Debt contribution per subsector** — available via `DF_CGD` (`CONTRIB_*` items) with NBB's own "contribution to consolidated gross debt" terminology already built into the codelist.
5. **S1312 further breakdown** — **yes**: individual communities/regions (Flemish Community, French Community, Walloon Region, Brussels-Capital Region, German-speaking Community, the two single-community commissions, the Joint Community Commission) available both for non-financial accounts (`GOVTYPE`/`SECTOR` dimension values) and debt (`DF_CGDS1312`).
6. **S1313 further breakdown** — **partially**: regional split only (Flemish/Walloon/Brussels/German-speaking local government), not individual municipality/province/CPAS level.
7. **Intergovernmental transfers** — no explicit bilateral flow table found; `DF_NFGOVFR_DISS` gives a funding-source view that is the best available proxy (see §6).
8. **Frequency** — annual (1995–2025+) and quarterly datasets exist as genuinely separate dataflows/DSDs; they must not be merged.

## 9. Recommendation

Proceed to Phase 5 (generic `NbbSdmxClient`/`NbbDatasetAdapter`) using the CSV data endpoint and the dataflow/DSD structure confirmed above, starting with `DF_NFGOV_DISS` (annual S1311–S1314 revenue/expenditure/balance) as the first imported dataset, since it has the cleanest DSD, full historical coverage, and a verified clean reconciliation against existing Eurostat data.

## 10. Implementation status

`DF_NFGOV_DISS` has been implemented and imported in production — see
`docs/NBB_IMPORT.md` and `docs/GOVERNMENT_SUBSECTORS.md` for the adapter
architecture, metric mapping, entity resolution, and reconciliation results.

One live-integration finding not covered above: NBB's edge WAF (F5 ASM)
fingerprints the HTTP/TLS client and silently serves an HTML error-redirect
page with a **misleading HTTP 200** to requests made via Node's global
`fetch` (undici); `curl` and Node's `https` module are unaffected. The
client (`src/data/adapters/nbb/client.ts`) uses `node:https` and defensively
checks response bodies against the WAF page even on a 200 status.

`DF_CGD` (consolidated gross debt / subsector contribution to it) has also
been implemented and imported in production — see `docs/NBB_IMPORT.md`
("`DF_CGD` — consolidated gross debt / subsector contribution") and
`docs/GOVERNMENT_SUBSECTORS.md` ("Debt contribution (S1311–S1314), from
`DF_CGD`") for the item-code investigation (the documented `CONTRIB` codes
return no data; `ITEM=CGD` per `GSECTOR` is the working series), metric
mapping, the subsector-sum-vs-S1300 investigation (does not sum, ~3.3% gap),
and the NBB-vs-Eurostat `gov_10q_ggdebt` reconciliation (33/33 quarters
exact `MATCH`, 2018-Q1–2026-Q1).

Per the sprint's closing instruction, no other NBB dataflow has been
imported yet — `DF_NFGOV_NET_DISS`, `DF_NFGOVQ_DISS`, `DF_NFGOVDETAIL_DISS`,
`DF_NFGOVCOFOG_DISS`, `DF_NFGOVTSC_DISS`, `DF_NFGOVFR_DISS`,
`DF_NFGOVISB_DISS`, `DF_CGDS1312`/`DF_CGDS1313` (subsector debt breakdown),
and `DF_FINGOV` remain candidates for a future sprint, pending explicit
go-ahead.
