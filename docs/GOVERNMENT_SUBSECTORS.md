# Government subsectors (S1311–S1314)

Belgium's general government sector (S13) is composed of four ESA 2010
subsectors, imported from NBB's `DF_NFGOV_DISS` (see `docs/NBB_IMPORT.md`):

| Subsector | Entity slug                  | Canonical label (nl)         |
|-----------|-------------------------------|-------------------------------|
| S1311     | `federale-overheid`           | Federale overheid             |
| S1312     | `gemeenschappen-en-gewesten`  | Gemeenschappen en gewesten    |
| S1313     | `lokale-overheden`            | Lokale overheden               |
| S1314     | `sociale-zekerheid`           | Sociale zekerheid              |

## S1311 label inconsistency (deliberately preserved)

NBB's own codelists gloss S1311 inconsistently across dataflows —
`DF_NFGOV_DISS` labels it "Central government" while `DF_NFGOVDETAIL_DISS`
labels the same code "Federal government". The platform's canonical label is
**"Federale overheid"** (a deliberate choice, not an accidental copy from
either source); this is documented on the `StatisticalSector` seed record
itself (`prisma/seed.ts`) so it isn't rediscovered as a bug later.

## Query layer

`src/server/queries/government-sectors.ts`:

- `getGovernmentSectorOverview(period?: number)` — revenue/expenditure/
  balance for all four subsectors at the "latest common compatible NBB
  annual period" (the most recent year for which *all four* subsectors have
  *all three* metrics), or an explicitly requested year.
- `getGovernmentSectorHistory(sectorSlug, metric)` — full annual history for
  one subsector and one metric.

## Consolidation guard — never sum subsectors into S13

**S1311 + S1312 + S1313 + S1314 ≠ S13.** Intergovernmental transfers between
subsectors are consolidated out of the official S13 figures but are present
in each subsector's own figures, so a naive sum overstates revenue and
expenditure. The platform:

- Always queries the official S13 observation directly (entity slug
  `belgie`) when a whole-government figure is needed — never derives it by
  summing subsectors.
- Surfaces `CONSOLIDATION_WARNING` (`government-sectors.ts`) alongside every
  subsector breakdown shown in the UI (`/belgie#overheidsniveaus`).
- `src/data/derivations/consolidation-guard.ts` exists purely to make this
  invariant testable: `compareSubsectorSumToOfficialS13()` computes the
  difference between a naive subsector sum and the official S13 figure (used
  in tests to prove they diverge — see
  `src/data/derivations/__tests__/consolidation-guard.test.ts`) and is
  deliberately never exported/used as a production "compute S13" function.
- No bilateral intergovernmental-transfer table is currently published by
  NBB; `DF_NFGOVFR_DISS` (taxes/contributions withheld to fund other
  subsectors) is the closest available proxy, and is explicitly out of scope
  for this sprint (see `docs/NBB_DATA_DISCOVERY.md`).

## UI

`/belgie#overheidsniveaus` ("Wie ontvangt en geeft het overheidsgeld uit?")
renders the four subsector cards via `getGovernmentSectorOverview()`,
including the non-summation disclaimer text. Activation was gated on the
NBB-vs-Eurostat reconciliation passing (`docs/NBB_IMPORT.md`) — it now does.
The homepage links to this section via a minimal CTA
(`src/components/home/government-sectors-cta.tsx`).

## Debt contribution (S1311–S1314), from `DF_CGD`

NBB's `DF_CGD` publishes each subsector's own consolidated gross debt figure
(`ITEM=CGD` per `GSECTOR`), which NBB's own codelist framing treats as that
subsector's "contribution to the total consolidated gross debt" (see
`docs/NBB_IMPORT.md` for why the literal `CONTRIB` item codes are unused —
they return no data). This is imported as a distinct canonical metric,
`subsectorDebtContribution`, deliberately never mapped onto `government_debt`
for the subsectors (only `S1300`'s figure is `government_debt`, matching
Eurostat's `gov_10q_ggdebt`).

### Subsector sum vs S1300 — investigated, does NOT hold

Unlike the "contribution" framing might suggest, **S1311 + S1312 + S1313 +
S1314 ≠ S1300** for this measure either — the same non-summation pattern as
revenue/expenditure/balance, though not assumed in advance; it was checked
directly against live data. Example, 2026-Q1 (EUR million):

| Sector | Value    |
|--------|----------|
| S1311  | 565,913  |
| S1312  | 135,844  |
| S1313  | 27,889   |
| S1314  | 373      |
| **Sum**| **730,019** |
| S1300 (official) | 706,581 |
| Difference | 23,438 |

The gap (~3.3% of the total) is consistent with intersectoral debt holdings
that the `TCA`/consolidating-element items in `CL_CGD_ITEM` exist to net
out — not imported this sprint. See
`src/data/derivations/__tests__/consolidation-guard.test.ts` for the
regression test proving this with the real 2026-Q1 figures.

### Consequences

- The public UI presents the four contributions and the S1300 total
  side-by-side, never as parts of a 100% pie (`docs/CONSOLIDATION.md`'s UI
  obligation applies here too) — a non-summation disclaimer accompanies the
  section (`DEBT_CONTRIBUTION_CONSOLIDATION_WARNING`,
  `src/server/queries/government-sectors-copy.ts`).
- A methodology note (`DEBT_CONTRIBUTION_METHODOLOGY_NOTE`) clarifies the
  figure is a *contribution* to the consolidated total, not necessarily
  that subsector's standalone gross debt — avoiding a "schuld van de
  federale overheid" framing the source does not support.

### Query layer

`src/server/queries/government-sectors.ts`:

- `getGovernmentSectorDebtContributions(period?: string)` — the four
  subsectors' `subsectorDebtContribution` at the latest common quarter (or
  an explicit "YYYY-Qn" period), alongside the official S1300
  `government_debt` total for the same quarter.
- `getGovernmentSectorDebtContributionHistory(sectorSlug)` — full quarterly
  history for one subsector.
