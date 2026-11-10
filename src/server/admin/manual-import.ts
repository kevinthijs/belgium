import "server-only";
import { prisma } from "@/lib/prisma";
import type { DataSourceAdapter } from "@/data/core/types";
import { runImport, type ImportRunSummary } from "@/data/import/runner/import-runner";
import { GovTenQGgDebtAdapter } from "@/data/adapters/eurostat/gov-10q-ggdebt-adapter";
import { GovTenAMainAdapter } from "@/data/adapters/eurostat/gov-10a-main-adapter";
import { GovTenAExpAdapter } from "@/data/adapters/eurostat/gov-10a-exp-adapter";
import { GovTenATaxagAdapter } from "@/data/adapters/eurostat/gov-10a-taxag-adapter";
import { isImportRunning } from "./queries/imports";

/**
 * Registry of datasets that support a manual "Check source" / "Run import"
 * trigger from /admin/data. Deliberately a small, explicit allow-list —
 * every entry here mirrors an existing, already-verified `scripts/import-*`
 * CLI script 1:1, so the UI trigger can never do anything the CLI couldn't
 * already do.
 *
 * The Statbel population dataset is intentionally NOT included: unlike the
 * Eurostat datasets, it requires municipality entity provisioning
 * (`npm run seed:statbel:municipalities`) as a prerequisite and its adapter
 * takes a large XLSX download (multi-MB, slow) — wiring that safely into a
 * synchronous web request needs a job queue this app doesn't have yet.
 * Deferred; see docs/ADMIN_DATA.md.
 */
export const MANUALLY_TRIGGERABLE_DATASETS: Record<
  string,
  { entityIdentifierScheme: string; accountingFrameworkCode?: string; buildAdapter: () => DataSourceAdapter }
> = {
  gov_10q_ggdebt: {
    entityIdentifierScheme: "EUROSTAT_GEO",
    accountingFrameworkCode: "EDP_MAASTRICHT",
    buildAdapter: () => new GovTenQGgDebtAdapter(),
  },
  gov_10a_main: {
    entityIdentifierScheme: "EUROSTAT_GEO",
    accountingFrameworkCode: "ESA2010",
    buildAdapter: () => new GovTenAMainAdapter(),
  },
  gov_10a_exp: {
    entityIdentifierScheme: "EUROSTAT_GEO",
    accountingFrameworkCode: "COFOG",
    buildAdapter: () => new GovTenAExpAdapter(),
  },
  gov_10a_taxag: {
    entityIdentifierScheme: "EUROSTAT_GEO",
    accountingFrameworkCode: "ESA2010",
    buildAdapter: () => new GovTenATaxagAdapter(),
  },
};

export function isManuallyTriggerable(datasetCode: string): boolean {
  return datasetCode in MANUALLY_TRIGGERABLE_DATASETS;
}

export async function checkSourceForUpdates(datasetId: string): Promise<{ hasUpdate: boolean; reason: string }> {
  const dataset = await prisma.sourceDataset.findUniqueOrThrow({ where: { id: datasetId } });
  const entry = MANUALLY_TRIGGERABLE_DATASETS[dataset.code];
  if (!entry) throw new Error(`Dataset ${dataset.code} does not support manual check.`);

  const adapter = entry.buildAdapter();
  const lastSuccessfulRun = await prisma.importRun.findFirst({
    where: { datasetId, status: { in: ["SUCCESS", "PARTIAL_SUCCESS"] } },
    orderBy: { startedAt: "desc" },
  });

  const result = await adapter.checkForUpdate({
    datasetCode: dataset.code,
    lastImportedChecksum: lastSuccessfulRun?.sourceChecksum ?? undefined,
  });
  await prisma.sourceDataset.update({ where: { id: datasetId }, data: { lastCheckedAt: new Date() } });
  return result;
}

export async function triggerManualImport(datasetId: string): Promise<ImportRunSummary> {
  const dataset = await prisma.sourceDataset.findUniqueOrThrow({ where: { id: datasetId } });
  const entry = MANUALLY_TRIGGERABLE_DATASETS[dataset.code];
  if (!entry) throw new Error(`Dataset ${dataset.code} does not support manual import.`);

  // Prevent simultaneous duplicate imports of the same dataset.
  if (await isImportRunning(datasetId)) {
    throw new Error("Er loopt al een import voor deze dataset. Wacht tot deze is afgerond.");
  }

  const adapter = entry.buildAdapter();
  return runImport(adapter, {
    entityIdentifierScheme: entry.entityIdentifierScheme,
    sourceDatasetId: datasetId,
    accountingFrameworkCode: entry.accountingFrameworkCode,
  });
}
