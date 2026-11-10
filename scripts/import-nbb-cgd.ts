import { prisma } from "@/lib/prisma";
import { createDfCgdAdapter } from "@/data/adapters/nbb/df-cgd";
import { runImport } from "@/data/import/runner/import-runner";

async function main() {
  const dataset = await prisma.sourceDataset.findFirstOrThrow({ where: { code: "DF_CGD" } });

  const adapter = createDfCgdAdapter();
  const summary = await runImport(adapter, {
    entityIdentifierScheme: "NBB_SECTOR",
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
