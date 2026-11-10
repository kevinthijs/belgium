import { prisma } from "@/lib/prisma";

const cache = new Map<string, string>();

/** Source-native unit codes (e.g. Eurostat "MIO_EUR") mapped to our canonical Unit rows. */
const SOURCE_UNIT_TO_CANONICAL: Record<string, string> = {
  MIO_EUR: "EUR_MILLION",
  PC_GDP: "PERCENT_GDP",
  PC: "PERCENT",
  // NBB.Stat DF_NFGOV_DISS UNIT codes: "E" Millions of euro, "P" % of GDP.
  E: "EUR_MILLION",
  P: "PERCENT_GDP",
};

export async function resolveUnitId(sourceUnitCode: string): Promise<string | null> {
  const canonicalCode = SOURCE_UNIT_TO_CANONICAL[sourceUnitCode] ?? sourceUnitCode;
  if (cache.has(canonicalCode)) return cache.get(canonicalCode)!;
  const unit = await prisma.unit.findUnique({ where: { code: canonicalCode }, select: { id: true } });
  if (!unit) return null;
  cache.set(canonicalCode, unit.id);
  return unit.id;
}
