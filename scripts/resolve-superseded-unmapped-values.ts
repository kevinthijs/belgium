/**
 * Marks OPEN UnmappedSourceValue(dimension="entity") rows RESOLVED when a
 * canonical entity mapping now exists for their rawValue — i.e. the value
 * was unmapped at the time an import ran, but a later mapping (e.g. the
 * province seed) or a later, more complete import run has since covered it.
 *
 * This never deletes history: `resolvedAt`/`status` are set, the row and
 * its original category/severity/context stay intact and queryable.
 */
import { prisma } from "@/lib/prisma";
import { resolveEntityIdsBatch } from "@/data/mappings/entities/resolve-entity";

const ENTITY_SCHEME_BY_DATASET: Record<string, string> = {
  gov_10q_ggdebt: "EUROSTAT_GEO",
  gov_10a_main: "EUROSTAT_GEO",
  gov_10a_exp: "EUROSTAT_GEO",
  gov_10a_taxag: "EUROSTAT_GEO",
  statbel_population_per_municipality: "NIS",
};

async function main() {
  const datasets = await prisma.sourceDataset.findMany({ select: { id: true, code: true } });

  let totalResolved = 0;

  for (const dataset of datasets) {
    const scheme = ENTITY_SCHEME_BY_DATASET[dataset.code];
    if (!scheme) continue;

    const importRunIds = (
      await prisma.importRun.findMany({ where: { datasetId: dataset.id }, select: { id: true } })
    ).map((r) => r.id);
    if (importRunIds.length === 0) continue;

    const openValues = await prisma.unmappedSourceValue.findMany({
      where: { importRunId: { in: importRunIds }, dimension: "entity", resolvedAt: null },
      select: { id: true, rawValue: true },
    });
    if (openValues.length === 0) continue;

    const uniqueRawValues = [...new Set(openValues.map((v) => v.rawValue))];
    const resolvedMap = await resolveEntityIdsBatch(scheme, uniqueRawValues);
    if (resolvedMap.size === 0) continue;

    const idsToResolve = openValues.filter((v) => resolvedMap.has(v.rawValue)).map((v) => v.id);
    if (idsToResolve.length === 0) continue;

    const result = await prisma.unmappedSourceValue.updateMany({
      where: { id: { in: idsToResolve } },
      data: { resolvedAt: new Date(), status: "RESOLVED" },
    });
    console.log(`${dataset.code}: resolved ${result.count} rows (now mapped via ${scheme})`);
    totalResolved += result.count;
  }

  console.log(`Total resolved: ${totalResolved}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
