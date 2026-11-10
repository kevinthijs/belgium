import { prisma } from "@/lib/prisma";
import { GovTenQGgDebtAdapter } from "@/data/adapters/eurostat/gov-10q-ggdebt-adapter";
import { runImport } from "@/data/import/runner/import-runner";

async function main() {
  const dataset = await prisma.sourceDataset.findFirstOrThrow({
    where: { code: "gov_10q_ggdebt" },
  });

  const adapter = new GovTenQGgDebtAdapter();
  const summary = await runImport(adapter, {
    entityIdentifierScheme: "EUROSTAT_GEO",
    sourceDatasetId: dataset.id,
    accountingFrameworkCode: "EDP_MAASTRICHT",
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
