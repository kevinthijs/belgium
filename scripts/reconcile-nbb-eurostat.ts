import { prisma } from "@/lib/prisma";
import { reconcileNbbAgainstEurostat, reconciliationPasses } from "@/data/derivations/nbb-eurostat-reconciliation";

async function main() {
  const years = [2021, 2022, 2023];
  const rows = await reconcileNbbAgainstEurostat(years);

  console.log(`NBB (DF_NFGOV_DISS) vs Eurostat (gov_10a_main) — S13, ${years.join("/")}\n`);
  console.table(rows);

  const passes = reconciliationPasses(rows);
  console.log(`\nReconciliation ${passes ? "PASSES" : "FAILS"} the Phase 18 public-UI activation gate.`);

  await prisma.$disconnect();
  if (!passes) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
