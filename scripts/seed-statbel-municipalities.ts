/**
 * Provisions a GovernmentEntity + ExternalEntityIdentifier(scheme="NIS")
 * row for every Belgian municipality, from the latest year available in
 * Statbel's "Bevolking per gemeente" workbook. Entities are matched and
 * upserted by NIS code only — never by name, since names aren't stable
 * (mergers, spelling, translation).
 *
 * Run once before `npm run import:statbel:population` if municipality
 * (Phase 2) coverage is wanted; national-level import works without this.
 */
import { prisma } from "@/lib/prisma";
import { StatbelPopulationClient } from "@/data/adapters/statbel/population-client";
import { parsePopulationWorkbook, type StatbelPopulationRow } from "@/data/adapters/statbel/population-xlsx-parser";

const REGION_SLUG_BY_NIS: Record<string, string> = {
  "02000": "vlaanderen",
  "03000": "wallonie",
  "04000": "brussel",
};

function slugify(name: string, nisCode: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `gemeente-${nisCode}-${base}`;
}

async function main() {
  const client = new StatbelPopulationClient();
  const { buffer } = await client.fetchWorkbook();
  const rows = parsePopulationWorkbook(buffer);

  const latestYear = Math.max(...rows.map((r) => r.year));
  const municipalities = rows.filter(
    (r): r is StatbelPopulationRow => r.year === latestYear && r.kind === "MUNICIPALITY",
  );

  const regionEntities = new Map<string, string>();
  for (const [nisCode, slug] of Object.entries(REGION_SLUG_BY_NIS)) {
    const entity = await prisma.governmentEntity.findUniqueOrThrow({ where: { slug } });
    regionEntities.set(nisCode, entity.id);
  }

  let created = 0;
  let updated = 0;
  let skippedNoRegion = 0;

  for (const row of municipalities) {
    const parentId = row.regionNisCode ? regionEntities.get(row.regionNisCode) : undefined;
    if (!parentId) {
      skippedNoRegion++;
      continue;
    }

    const slug = slugify(row.name, row.nisCode);
    const existed = await prisma.governmentEntity.findUnique({ where: { slug }, select: { id: true } });
    const entity = await prisma.governmentEntity.upsert({
      where: { slug },
      update: { name: row.name, parentId, nisCode: row.nisCode },
      create: {
        slug,
        name: row.name,
        entityType: "MUNICIPALITY",
        parentId,
        countryCode: "BE",
        nisCode: row.nisCode,
      },
    });
    if (existed) updated++;
    else created++;

    await prisma.externalEntityIdentifier.upsert({
      where: { scheme_value_entityId: { scheme: "NIS", value: row.nisCode, entityId: entity.id } },
      update: {},
      create: { entityId: entity.id, scheme: "NIS", value: row.nisCode },
    });
  }

  console.log(`Municipality entities provisioned from year ${latestYear}:`, {
    total: municipalities.length,
    created,
    updated,
    skippedNoRegion,
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
