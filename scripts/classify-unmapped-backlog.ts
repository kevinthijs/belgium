/**
 * One-off backfill: applies `classifyUnmapped()` to existing OPEN
 * `UnmappedSourceValue` rows created before category/severity existed
 * (default OTHER/WARNING from the migration). Safe to re-run — it only
 * touches rows still at the pre-classification default and does not
 * change `resolvedAt`/history.
 *
 * Batched by (dataset, dimension, rawValue) rather than row-by-row: the
 * backlog has tens of thousands of rows but only a few hundred distinct
 * combinations, and classification only depends on that combination.
 */
import { prisma } from "@/lib/prisma";
import { classifyUnmapped } from "@/server/admin/unmapped-classification";

async function main() {
  const datasets = await prisma.sourceDataset.findMany({ select: { id: true, code: true } });

  const counts = new Map<string, number>();
  let totalUpdated = 0;

  for (const dataset of datasets) {
    const importRunIds = (
      await prisma.importRun.findMany({ where: { datasetId: dataset.id }, select: { id: true } })
    ).map((r) => r.id);
    if (importRunIds.length === 0) continue;

    const combos = await prisma.unmappedSourceValue.groupBy({
      by: ["dimension", "rawValue"],
      where: { importRunId: { in: importRunIds }, category: "OTHER", severity: "WARNING" },
    });

    for (const combo of combos) {
      const { category, severity } = classifyUnmapped({
        datasetCode: dataset.code,
        dimension: combo.dimension,
        rawValue: combo.rawValue,
      });
      const result = await prisma.unmappedSourceValue.updateMany({
        where: {
          importRunId: { in: importRunIds },
          dimension: combo.dimension,
          rawValue: combo.rawValue,
          category: "OTHER",
          severity: "WARNING",
        },
        data: { category, severity },
      });
      counts.set(category, (counts.get(category) ?? 0) + result.count);
      totalUpdated += result.count;
    }
  }

  console.log(`Updated ${totalUpdated} rows.`);
  console.log("By category:", Object.fromEntries(counts));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
