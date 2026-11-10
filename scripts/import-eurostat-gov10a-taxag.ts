import { prisma } from "@/lib/prisma";
import { GovTenATaxagAdapter } from "@/data/adapters/eurostat/gov-10a-taxag-adapter";
import { runImport } from "@/data/import/runner/import-runner";

async function main() {
  const dataset = await prisma.sourceDataset.findFirstOrThrow({ where: { code: "gov_10a_taxag" } });

  const adapter = new GovTenATaxagAdapter();
  const summary = await runImport(adapter, {
    entityIdentifierScheme: "EUROSTAT_GEO",
    sourceDatasetId: dataset.id,
    accountingFrameworkCode: "ESA2010",
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
