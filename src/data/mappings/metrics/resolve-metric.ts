import { prisma } from "@/lib/prisma";

const cache = new Map<string, string>();

/** Metric codes are shared, canonical vocabulary — no per-source translation needed today. */
export async function resolveMetricId(code: string): Promise<string | null> {
  if (cache.has(code)) return cache.get(code)!;
  const metric = await prisma.metric.findUnique({ where: { code }, select: { id: true } });
  if (!metric) return null;
  cache.set(code, metric.id);
  return metric.id;
}
