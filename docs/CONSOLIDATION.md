# Consolidation

"Consolidation" here means: eliminating transactions *between* government
subsectors so that a whole-government total isn't inflated by money that
just moved from one part of government to another (e.g. federal grants to
regions, or state subsidies passed through to local governments).

## The rule

**Never reconstruct a consolidated total (e.g. S13) by summing its
subsectors' own reported figures.** Each subsector's individually reported
revenue/expenditure includes intergovernmental transfers it received or
made; the official consolidated total has those transfers netted out. Summing
S1311 + S1312 + S1313 + S1314 therefore double-counts money that flows
between them and overstates both revenue and expenditure relative to the
official S13 figure.

Concretely, for 2021 S13 revenue: the official (Eurostat/NBB-matching)
figure is €250,681.2M, while a naive sum of the four subsectors is
materially higher — see
`src/data/derivations/__tests__/consolidation-guard.test.ts` for the exact
numbers and a regression test proving the two diverge.

## Where this applies

- **Government subsectors (S1311–S1314) vs S13** — see
  `docs/GOVERNMENT_SUBSECTORS.md`. `src/data/derivations/consolidation-guard.ts`
  exists to make this testable; there is no production function that sums
  subsectors into a whole-government figure. Whole-government figures always
  come from the entity `belgie` observation directly.
- **Comparability/consolidation status on observations** — every
  `Observation` carries a `consolidationStatus` field (see `prisma/schema.prisma`)
  independent of this subsector concern; that field tracks whether a given
  *observation itself* is a consolidated aggregate within its own source
  dataset, not whether subsector figures have been summed.

## UI obligations

Any UI that shows subsector-level figures alongside or near a whole-government
figure must carry an explicit non-summation disclaimer
(`CONSOLIDATION_WARNING` in `src/server/queries/government-sectors.ts`) —
never silently imply that the subsector cards add up to the whole-government
total shown elsewhere on the page.
