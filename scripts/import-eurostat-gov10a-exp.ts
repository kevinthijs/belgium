import { prisma } from "@/lib/prisma";
import { GovTenAExpAdapter } from "@/data/adapters/eurostat/gov-10a-exp-adapter";
import { runImport } from "@/data/import/runner/import-runner";

async function main() {
  const dataset = await prisma.sourceDataset.findFirstOrThrow({ where: { code: "gov_10a_exp" } });

  const adapter = new GovTenAExpAdapter();
  const summary = await runImport(adapter, {
    entityIdentifierScheme: "EUROSTAT_GEO",
    sourceDatasetId: dataset.id,
    accountingFrameworkCode: "COFOG",
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
