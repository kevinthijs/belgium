import { prisma } from "@/lib/prisma";

/**
 * Resolves a source-native entity code (e.g. Eurostat geo="BE", NIS code
 * "34041") to a canonical GovernmentEntity via ExternalEntityIdentifier.
 * Never joins on entity *names* — codes are the identity layer, because
 * names change (municipal renames, mergers, translations).
 */
export async function resolveEntityId(
  scheme: string,
  value: string,
): Promise<string | null> {
  const identifier = await prisma.externalEntityIdentifier.findFirst({
    where: { scheme, value },
    select: { entityId: true },
  });
  return identifier?.entityId ?? null;
}

export async function resolveEntityIdsBatch(
  scheme: string,
  values: string[],
): Promise<Map<string, string>> {
  const identifiers = await prisma.externalEntityIdentifier.findMany({
    where: { scheme, value: { in: values } },
    select: { value: true, entityId: true },
  });
  return new Map(identifiers.map((i) => [i.value, i.entityId]));
}
