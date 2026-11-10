import { prisma } from "@/lib/prisma";

const cache = new Map<string, string>();

/**
 * Resolves a source-native classification code (e.g. COFOG "07") against a
 * ClassificationSystem's items. Unknown codes return null so the caller can
 * log them via UnmappedSourceValue instead of silently dropping them.
 */
export async function resolveClassificationItemId(
  systemCode: string,
  itemCode: string,
): Promise<string | null> {
  const cacheKey = `${systemCode}:${itemCode}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const item = await prisma.classificationItem.findFirst({
    where: { code: itemCode, system: { code: systemCode } },
    select: { id: true },
  });
  if (!item) return null;

  cache.set(cacheKey, item.id);
  return item.id;
}
