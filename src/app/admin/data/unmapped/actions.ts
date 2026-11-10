"use server";

import { revalidatePath } from "next/cache";
import { getUnmappedGroupIds, markUnmappedGroupStatus } from "@/server/admin/queries/unmapped";

async function markGroupAction(
  datasetCode: string,
  dimension: string,
  rawValue: string,
  status: "REVIEWED" | "IGNORED_EXPECTED",
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const ids = await getUnmappedGroupIds(datasetCode, dimension, rawValue);
    const count = await markUnmappedGroupStatus(ids, status);
    revalidatePath("/admin/data/unmapped");
    revalidatePath("/admin/data");
    return { ok: true, count };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Onbekende fout." };
  }
}

export async function markReviewedAction(datasetCode: string, dimension: string, rawValue: string) {
  return markGroupAction(datasetCode, dimension, rawValue, "REVIEWED");
}

export async function markIgnoredExpectedAction(datasetCode: string, dimension: string, rawValue: string) {
  return markGroupAction(datasetCode, dimension, rawValue, "IGNORED_EXPECTED");
}
