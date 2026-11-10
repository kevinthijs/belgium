/**
 * Provisions a GovernmentEntity(entityType=PROVINCE) + ExternalEntityIdentifier
 * (scheme="NIS") row for each of Belgium's 10 provinces, using the official
 * NIS province codes. Brussels-Capital Region has no province and is
 * intentionally not represented here.
 *
 * Statbel's population workbook reports a "Provincie X" aggregate row for 8
 * of the 10 provinces directly (Antwerpen, West-Vlaanderen, Oost-Vlaanderen,
 * Henegouwen, Luik, Limburg, Luxemburg, Namen — NIS codes ending in a single
 * non-zero leading digit followed by 0000). Vlaams-Brabant and Waals-Brabant
 * (Brabant wallon) don't appear as a direct aggregate row in that dataset
 * (undivided Brabant province was split in 1995; Statbel only publishes
 * their constituent arrondissements) — those two are provisioned here as
 * canonical entities but won't gain population observations until an NIS
 * mapping for them becomes available from a source that publishes it.
 *
 * Run before `npm run seed:statbel:municipalities` so municipalities can be
 * parented under the correct province in a later phase if desired; province
 * entities are parented under their region regardless of run order.
 */
import { prisma } from "@/lib/prisma";

const PROVINCES: Array<{
  nisCode: string;
  slug: string;
  name: string;
  regionSlug: "vlaanderen" | "wallonie";
  /** Whether Statbel's population workbook reports this province directly. */
  hasDirectPopulationRow: boolean;
}> = [
  { nisCode: "10000", slug: "provincie-antwerpen", name: "Antwerpen", regionSlug: "vlaanderen", hasDirectPopulationRow: true },
  { nisCode: "70000", slug: "provincie-limburg", name: "Limburg", regionSlug: "vlaanderen", hasDirectPopulationRow: true },
  { nisCode: "40000", slug: "provincie-oost-vlaanderen", name: "Oost-Vlaanderen", regionSlug: "vlaanderen", hasDirectPopulationRow: true },
  { nisCode: "20001", slug: "provincie-vlaams-brabant", name: "Vlaams-Brabant", regionSlug: "vlaanderen", hasDirectPopulationRow: false },
  { nisCode: "30000", slug: "provincie-west-vlaanderen", name: "West-Vlaanderen", regionSlug: "vlaanderen", hasDirectPopulationRow: true },
  { nisCode: "50000", slug: "provincie-henegouwen", name: "Henegouwen", regionSlug: "wallonie", hasDirectPopulationRow: true },
  { nisCode: "60000", slug: "provincie-luik", name: "Luik", regionSlug: "wallonie", hasDirectPopulationRow: true },
  { nisCode: "80000", slug: "provincie-luxemburg", name: "Luxemburg", regionSlug: "wallonie", hasDirectPopulationRow: true },
  { nisCode: "90000", slug: "provincie-namen", name: "Namen", regionSlug: "wallonie", hasDirectPopulationRow: true },
  { nisCode: "20002", slug: "provincie-waals-brabant", name: "Waals-Brabant", regionSlug: "wallonie", hasDirectPopulationRow: false },
];

async function main() {
  const regionsBySlug = new Map<string, string>();
  for (const regionSlug of ["vlaanderen", "wallonie"] as const) {
    const entity = await prisma.governmentEntity.findFirstOrThrow({ where: { slug: regionSlug } });
    regionsBySlug.set(regionSlug, entity.id);
  }

  let created = 0;
  let updated = 0;

  for (const province of PROVINCES) {
    const parentId = regionsBySlug.get(province.regionSlug)!;
    const existed = await prisma.governmentEntity.findUnique({ where: { slug: province.slug }, select: { id: true } });
    const entity = await prisma.governmentEntity.upsert({
      where: { slug: province.slug },
      update: { name: province.name, parentId, nisCode: province.nisCode },
      create: {
        slug: province.slug,
        name: province.name,
        entityType: "PROVINCE",
        parentId,
        countryCode: "BE",
        nisCode: province.nisCode,
      },
    });
    if (existed) updated++;
    else created++;

    await prisma.externalEntityIdentifier.upsert({
      where: { scheme_value_entityId: { scheme: "NIS", value: province.nisCode, entityId: entity.id } },
      update: {},
      create: { entityId: entity.id, scheme: "NIS", value: province.nisCode },
    });
  }

  console.log("Province entities provisioned:", {
    total: PROVINCES.length,
    created,
    updated,
    withoutDirectPopulationRow: PROVINCES.filter((p) => !p.hasDirectPopulationRow).map((p) => p.name),
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
