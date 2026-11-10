import { prisma } from "@/lib/prisma";
import { reconcileNbbDebtAgainstEurostat, debtReconciliationPasses } from "@/data/derivations/nbb-eurostat-debt-reconciliation";

async function main() {
  const quarters: Array<{ year: number; quarter: number }> = [];
  for (let year = 2018; year <= 2026; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      if (year === 2026 && quarter > 1) continue; // latest available quarter
      quarters.push({ year, quarter });
    }
  }
  const rows = await reconcileNbbDebtAgainstEurostat(quarters);

  console.log(`NBB (DF_CGD, S1300) vs Eurostat (gov_10q_ggdebt) — government_debt, ${quarters[0]!.year}-Q${quarters[0]!.quarter} to ${quarters[quarters.length - 1]!.year}-Q${quarters[quarters.length - 1]!.quarter}\n`);
  console.table(rows);

  const passes = debtReconciliationPasses(rows);
  console.log(`\nReconciliation ${passes ? "PASSES" : "FAILS"}.`);

  await prisma.$disconnect();
  if (!passes) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
