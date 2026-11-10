import { prisma } from "@/lib/prisma";
import { StatbelPopulationAdapter } from "@/data/adapters/statbel/statbel-population-adapter";
import { runImport } from "@/data/import/runner/import-runner";

async function main() {
  const dataset = await prisma.sourceDataset.findFirstOrThrow({
    where: { code: "statbel_population_per_municipality" },
  });

  const adapter = new StatbelPopulationAdapter();
  const summary = await runImport(adapter, {
    entityIdentifierScheme: "NIS",
    sourceDatasetId: dataset.id,
  });

  console.log("Import run:", summary);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
