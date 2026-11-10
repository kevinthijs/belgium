"use server";

import { revalidatePath } from "next/cache";
import { checkSourceForUpdates, triggerManualImport } from "@/server/admin/manual-import";

export async function checkSourceAction(datasetId: string): Promise<{ ok: true; hasUpdate: boolean; reason: string } | { ok: false; error: string }> {
  try {
    const result = await checkSourceForUpdates(datasetId);
    revalidatePath(`/admin/data/datasets/${datasetId}`);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Onbekende fout." };
  }
}

export async function triggerImportAction(
  datasetId: string,
): Promise<{ ok: true; created: number; updated: number; rejected: number; filtered: number } | { ok: false; error: string }> {
  try {
    const summary = await triggerManualImport(datasetId);
    revalidatePath(`/admin/data/datasets/${datasetId}`);
    revalidatePath("/admin/data");
    revalidatePath("/admin/data/imports");
    return { ok: true, created: summary.created, updated: summary.updated, rejected: summary.rejected, filtered: summary.filtered };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Onbekende fout." };
  }
}
