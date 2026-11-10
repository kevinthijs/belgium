import { prisma } from "@/lib/prisma";
import { computeLinearRecentDebtChangeEstimate } from "@/data/derivations/debt-estimate";

async function main() {
  const estimate = await computeLinearRecentDebtChangeEstimate("belgie");
  console.log("Debt estimate model created:", estimate.id, {
    annualizedChange: estimate.annualizedChange?.toString(),
    dailyChange: estimate.dailyChange?.toString(),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
