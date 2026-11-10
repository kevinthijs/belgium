/**
 * Seeds reference dimensions only: source registry, accounting frameworks,
 * statistical sectors, units, metrics, classification systems and the
 * top-level Belgian government entities. Never seeds financial
 * observations — those must enter through adapters/imports.
 */
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // --- Source organisations ---
  const eurostat = await prisma.sourceOrganisation.upsert({
    where: { code: "EUROSTAT" },
    update: {},
    create: {
      code: "EUROSTAT",
      name: "Eurostat",
      website: "https://ec.europa.eu/eurostat",
      defaultLicence: "CC BY 4.0",
    },
  });
  const nbb = await prisma.sourceOrganisation.upsert({
    where: { code: "NBB" },
    update: { website: "https://www.nbb.be", defaultLicence: "NBB.Stat terms of use" },
    create: {
      code: "NBB",
      name: "Nationale Bank van België / NBB.Stat",
      website: "https://www.nbb.be",
      defaultLicence: "NBB.Stat terms of use",
    },
  });
  const statbel = await prisma.sourceOrganisation.upsert({
    where: { code: "STATBEL" },
    update: { defaultLicence: "CC BY 4.0" },
    create: {
      code: "STATBEL",
      name: "Statbel",
      website: "https://statbel.fgov.be",
      defaultLicence: "CC BY 4.0",
    },
  });
  await prisma.sourceOrganisation.upsert({
    where: { code: "VLAAMSE_OVERHEID" },
    update: {},
    create: { code: "VLAAMSE_OVERHEID", name: "Vlaamse overheid / Agentschap Binnenlands Bestuur" },
  });
  await prisma.sourceOrganisation.upsert({
    where: { code: "SPW" },
    update: {},
    create: { code: "SPW", name: "Service Public de Wallonie - Finances" },
  });
  await prisma.sourceOrganisation.upsert({
    where: { code: "BRUSSELS_FINANCE_BUDGET" },
    update: {},
    create: { code: "BRUSSELS_FINANCE_BUDGET", name: "Brussels Gewest - Financiën en Begroting" },
  });
  await prisma.sourceOrganisation.upsert({
    where: { code: "IBSA" },
    update: {},
    create: { code: "IBSA", name: "IBSA / BISA (Brussels Institute for Statistics and Analysis)" },
  });

  // --- Accounting frameworks ---
  const frameworks = [
    ["ESA2010", "ESA 2010 / ESR 2010"],
    ["EDP_MAASTRICHT", "Excessive Deficit Procedure (Maastricht debt/deficit)"],
    ["BBC_FLANDERS", "Beleids- en Beheerscyclus (Vlaamse lokale besturen)"],
    ["WALLOON_LOCAL_ACCOUNTING", "Comptabilité communale wallonne"],
    ["BRUSSELS_ACCOUNTING", "Brussels Hoofdstedelijk Gewest boekhouding"],
    ["FEDERAL_BUDGET_ACCOUNTING", "Federale begrotingsboekhouding"],
    ["COFOG", "Classification of the Functions of Government"],
    ["OTHER", "Overig / niet-gespecificeerd"],
  ] as const;
  for (const [code, name] of frameworks) {
    await prisma.accountingFramework.upsert({ where: { code }, update: {}, create: { code, name } });
  }
  const edp = await prisma.accountingFramework.findUniqueOrThrow({ where: { code: "EDP_MAASTRICHT" } });

  // --- Statistical sectors (ESA 2010) ---
  // Canonical Dutch labels per the NBB import sprint decision (docs/GOVERNMENT_SUBSECTORS.md):
  // NBB's own dataflows gloss S1311 inconsistently ("Central government" in
  // DF_NFGOV_DISS's GOVTYPE codelist vs "Federal government" in
  // DF_NFGOVDETAIL_DISS's SECTOR codelist, both for the identical ESA code).
  // We pick ONE canonical label here; the raw NBB label seen per dataflow is
  // preserved in `description`, never silently discarded.
  const s13 = await prisma.statisticalSector.upsert({
    where: { code: "S13" },
    update: { name: "Algemene overheid", description: "ESA 2010 S.13 General government (EN)." },
    create: { code: "S13", name: "Algemene overheid", description: "ESA 2010 S.13 General government (EN)." },
  });
  const sectorChildren = [
    [
      "S1311",
      "Federale overheid",
      'ESA 2010 S.1311 Federal government (EN). NBB glosses this code as "Central government" in DF_NFGOV_DISS and "Federal government" in DF_NFGOVDETAIL_DISS — both raw labels observed live; "Federale overheid" / "Federal government" chosen as the single canonical label.',
    ],
    ["S1312", "Gemeenschappen en gewesten", 'ESA 2010 S.1312 State government (EN). NBB label: "State government" / "Communities and regions".'],
    ["S1313", "Lokale overheden", "ESA 2010 S.1313 Local government (EN)."],
    ["S1314", "Sociale zekerheid", "ESA 2010 S.1314 Social security funds (EN)."],
  ] as const;
  for (const [code, name, description] of sectorChildren) {
    await prisma.statisticalSector.upsert({
      where: { code },
      update: { name, description },
      create: { code, name, description, parentId: s13.id },
    });
  }
  const sectorByCode = new Map(
    await Promise.all(
      ["S13", "S1311", "S1312", "S1313", "S1314"].map(
        async (code) => [code, await prisma.statisticalSector.findUniqueOrThrow({ where: { code } })] as const,
      ),
    ),
  );

  // --- Units ---
  const units = [
    ["EUR", "Euro", "€", 1],
    ["EUR_MILLION", "Miljoen euro", "€", 1_000_000],
    ["EUR_BILLION", "Miljard euro", "€", 1_000_000_000],
    ["EUR_PER_CAPITA", "Euro per inwoner", "€", 1],
    ["PERCENT", "Procent", "%", 1],
    ["PERCENT_GDP", "Procent van het bbp", "%", 1],
    ["PERSONS", "Personen", undefined, 1],
    ["HOUSEHOLDS", "Huishoudens", undefined, 1],
  ] as const;
  for (const [code, name, symbol, scaleFactor] of units) {
    await prisma.unit.upsert({
      where: { code },
      update: {},
      create: { code, name, symbol, scaleFactor },
    });
  }
  const eurMillion = await prisma.unit.findUniqueOrThrow({ where: { code: "EUR_MILLION" } });
  const percentGdp = await prisma.unit.findUniqueOrThrow({ where: { code: "PERCENT_GDP" } });

  // --- Metrics ---
  const metrics = [
    ["government_debt", "Overheidsschuld (Maastrichtschuld)", "STOCK", "SUM" as const],
    ["government_revenue", "Overheidsontvangsten", "FLOW", "SUM" as const],
    ["government_expenditure", "Overheidsuitgaven", "FLOW", "SUM" as const],
    ["net_lending_borrowing", "Vorderingensaldo (overheidssaldo)", "FLOW", "SUM" as const],
    ["primary_balance", "Primair saldo", "FLOW", "SUM" as const],
    ["interest_expenditure", "Rente-uitgaven", "FLOW", "SUM" as const],
    ["gdp", "Bruto binnenlands product", "FLOW", "SUM" as const],
    ["population", "Bevolking", "COUNT", "LAST_VALUE" as const],
    ["households", "Huishoudens", "COUNT", "LAST_VALUE" as const],
    // Eurostat also publishes these as harmonised ratios directly (gov_10a_main,
    // gov_10q_ggdebt with unit=PC_GDP) — imported as-is, never derived by dividing
    // our own EUR figures by a separately-sourced GDP figure.
    ["government_debt_pct_gdp", "Overheidsschuld (% bbp)", "RATIO", "NONE" as const],
    ["government_revenue_pct_gdp", "Overheidsontvangsten (% bbp)", "RATIO", "NONE" as const],
    ["government_expenditure_pct_gdp", "Overheidsuitgaven (% bbp)", "RATIO", "NONE" as const],
    ["net_lending_borrowing_pct_gdp", "Vorderingensaldo (% bbp)", "RATIO", "NONE" as const],
    // gov_10a_taxag — main national accounts tax aggregates (S13). Distinct from
    // government_revenue: taxes/social contributions are a subset of total revenue,
    // never treated as equal to it (see src/data/derivations/hundred-euro-revenue.ts).
    ["taxes_production_imports", "Belastingen op productie en invoer (D2)", "FLOW", "SUM" as const],
    ["taxes_vat", "Btw-ontvangsten (D211)", "FLOW", "SUM" as const],
    ["taxes_income", "Belastingen op inkomen (D5)", "FLOW", "SUM" as const],
    ["taxes_income_personal", "Personenbelasting (D51A)", "FLOW", "SUM" as const],
    ["taxes_income_corporate", "Vennootschapsbelasting (D51B)", "FLOW", "SUM" as const],
    ["social_contributions", "Sociale bijdragen (D61)", "FLOW", "SUM" as const],
    ["capital_taxes", "Vermogensbelastingen (D91)", "FLOW", "SUM" as const],
    ["total_tax_receipts", "Totale belastingontvangsten (D2+D5+D91)", "FLOW", "SUM" as const],
    // NBB DF_NFGOV_DISS components without an existing canonical metric —
    // see docs/NBB_IMPORT.md for the verified ITEM -> metric mapping table.
    ["compensation_of_employees", "Beloning van werknemers (D1)", "FLOW", "SUM" as const],
    ["imputed_social_contributions", "Toegerekende sociale bijdragen (D612)", "FLOW", "SUM" as const],
    ["gross_fixed_capital_formation", "Bruto-investeringen in vaste activa (P51g)", "FLOW", "SUM" as const],
    ["gross_saving", "Bruto besparingen (B8g)", "FLOW", "SUM" as const],
    ["interest_received", "Renteontvangsten (D41, ontvangen)", "FLOW", "SUM" as const],
    // NBB DF_CGD — deliberately distinct from government_debt: this is
    // each subsector's own consolidated gross debt figure, which does NOT
    // sum to the S1300 total (intersectoral holdings are not netted out
    // across subsectors the way they are for the S1300 total itself). See
    // docs/GOVERNMENT_SUBSECTORS.md.
    ["subsectorDebtContribution", "Bijdrage aan de geconsolideerde overheidsschuld", "STOCK", "NONE" as const],
  ] as const;
  for (const [code, name, metricType, aggregationMethod] of metrics) {
    await prisma.metric.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name,
        metricType,
        aggregationMethod,
        defaultUnitId:
          metricType === "STOCK" || metricType === "FLOW"
            ? eurMillion.id
            : metricType === "RATIO"
              ? percentGdp.id
              : undefined,
        isFinancial: metricType !== "COUNT",
      },
    });
  }

  // --- Classification systems ---
  const cofog = await prisma.classificationSystem.upsert({
    where: { code: "COFOG" },
    update: {},
    create: { code: "COFOG", name: "Classification of the Functions of Government" },
  });
  const cofogItems = [
    ["01", "Algemeen overheidsbestuur"],
    ["02", "Defensie"],
    ["03", "Openbare orde en veiligheid"],
    ["04", "Economische aangelegenheden"],
    ["05", "Milieubescherming"],
    ["06", "Huisvesting en gemeenschapsvoorzieningen"],
    ["07", "Gezondheidszorg"],
    ["08", "Recreatie, cultuur en religie"],
    ["09", "Onderwijs"],
    ["10", "Sociale bescherming"],
  ] as const;
  for (const [code, name] of cofogItems) {
    await prisma.classificationItem.upsert({
      where: { systemId_code: { systemId: cofog.id, code } },
      update: {},
      create: { systemId: cofog.id, code, name, level: 0 },
    });
  }

  // --- Belgian government entity hierarchy ---
  const belgium = await upsertEntity({
    slug: "belgie",
    name: "België",
    officialName: "Koninkrijk België",
    entityType: "COUNTRY",
    statisticalSectorId: s13.id,
  });
  const federaal = await upsertEntity({
    slug: "federale-overheid",
    name: "Federale overheid",
    entityType: "FEDERAL_GOVERNMENT",
    parentId: belgium.id,
    statisticalSectorId: sectorByCode.get("S1311")!.id,
  });
  const vlaanderen = await upsertEntity({ slug: "vlaanderen", name: "Vlaanderen", entityType: "COMMUNITY_REGION", parentId: belgium.id, regionCode: "BE2" });
  const wallonie = await upsertEntity({ slug: "wallonie", name: "Wallonië", entityType: "REGION", parentId: belgium.id, regionCode: "BE3" });
  const brussel = await upsertEntity({ slug: "brussel", name: "Brussels Hoofdstedelijk Gewest", entityType: "REGION", parentId: belgium.id, regionCode: "BE1" });
  await upsertEntity({ slug: "franse-gemeenschap", name: "Federatie Wallonië-Brussel", entityType: "COMMUNITY", parentId: belgium.id });
  await upsertEntity({ slug: "duitstalige-gemeenschap", name: "Duitstalige Gemeenschap", entityType: "COMMUNITY", parentId: belgium.id });
  const socialeZekerheid = await upsertEntity({
    slug: "sociale-zekerheid",
    name: "Sociale zekerheid",
    entityType: "SOCIAL_SECURITY",
    parentId: belgium.id,
    statisticalSectorId: sectorByCode.get("S1314")!.id,
  });

  // Pure statistical aggregates (S1312, S1313 totals) — these don't
  // correspond to one administrative body but ARE required by NBB's
  // GOVTYPE codelist and by Observation.entityId being a required FK.
  // Do NOT treat these as a substitute for summing their administrative
  // children (see docs/CONSOLIDATION.md).
  const gemeenschappenEnGewesten = await upsertEntity({
    slug: "gemeenschappen-en-gewesten",
    name: "Gemeenschappen en gewesten",
    entityType: "GENERAL_GOVERNMENT",
    parentId: belgium.id,
    statisticalSectorId: sectorByCode.get("S1312")!.id,
  });
  const lokaleOverheden = await upsertEntity({
    slug: "lokale-overheden",
    name: "Lokale overheden",
    entityType: "GENERAL_GOVERNMENT",
    parentId: belgium.id,
    statisticalSectorId: sectorByCode.get("S1313")!.id,
  });

  // --- International comparison entities (for Eurostat geo mapping) ---
  const netherlands = await upsertEntity({ slug: "nederland", name: "Nederland", entityType: "COUNTRY", countryCode: "NL" });
  const france = await upsertEntity({ slug: "frankrijk", name: "Frankrijk", entityType: "COUNTRY", countryCode: "FR" });
  const germany = await upsertEntity({ slug: "duitsland", name: "Duitsland", entityType: "COUNTRY", countryCode: "DE" });
  const euAggregate = await upsertEntity({ slug: "eu27", name: "Europese Unie (27)", entityType: "GENERAL_GOVERNMENT", countryCode: "EU27_2020" });

  // --- External identifiers (Eurostat geo dimension codes) ---
  const geoMap: Array<[string, string]> = [
    [belgium.id, "BE"],
    [netherlands.id, "NL"],
    [france.id, "FR"],
    [germany.id, "DE"],
    [euAggregate.id, "EU27_2020"],
  ];
  for (const [entityId, geoCode] of geoMap) {
    await prisma.externalEntityIdentifier.upsert({
      where: { scheme_value_entityId: { scheme: "EUROSTAT_GEO", value: geoCode, entityId } },
      update: {},
      create: { entityId, scheme: "EUROSTAT_GEO", value: geoCode },
    });
  }

  // --- External identifiers (Statbel NIS codes: country + 3 regions;
  // municipalities are provisioned separately, see scripts/seed-statbel-municipalities.ts) ---
  const nisMap: Array<[string, string]> = [
    [belgium.id, "01000"],
    [vlaanderen.id, "02000"],
    [wallonie.id, "03000"],
    [brussel.id, "04000"],
  ];
  for (const [entityId, nisCode] of nisMap) {
    await prisma.externalEntityIdentifier.upsert({
      where: { scheme_value_entityId: { scheme: "NIS", value: nisCode, entityId } },
      update: {},
      create: { entityId, scheme: "NIS", value: nisCode },
    });
  }

  // --- External identifiers (NBB GOVTYPE codes, DF_NFGOV_DISS) ---
  const nbbSectorMap: Array<[string, string]> = [
    [belgium.id, "S1300"],
    [federaal.id, "S1311"],
    [gemeenschappenEnGewesten.id, "S1312"],
    [lokaleOverheden.id, "S1313"],
    [socialeZekerheid.id, "S1314"],
  ];
  for (const [entityId, nbbCode] of nbbSectorMap) {
    await prisma.externalEntityIdentifier.upsert({
      where: { scheme_value_entityId: { scheme: "NBB_SECTOR", value: nbbCode, entityId } },
      update: {},
      create: { entityId, scheme: "NBB_SECTOR", value: nbbCode },
    });
  }

  // --- Statbel source dataset (population per municipality) ---
  await prisma.sourceDataset.upsert({
    where: { organisationId_code: { organisationId: statbel.id, code: "statbel_population_per_municipality" } },
    update: {},
    create: {
      organisationId: statbel.id,
      code: "statbel_population_per_municipality",
      name: "Bevolking per gemeente op 1 januari (1992-2026)",
      description:
        "Officiële wettelijke bevolking van België, de 3 gewesten en alle gemeenten, op 1 januari van elk jaar.",
      landingPageUrl: "https://statbel.fgov.be/nl/themas/bevolking/structuur-van-de-bevolking",
      apiUrl:
        "https://statbel.fgov.be/sites/default/files/files/documents/bevolking/5.1%20Structuur%20van%20de%20bevolking/Bevolking_per_gemeente.xlsx",
      dataFormat: "XLSX",
      frequency: "ANNUAL",
      licence: "CC BY 4.0",
      attributionText: "Statbel, Bevolking per gemeente op 1 januari",
      firstAvailablePeriod: "1992-01-01",
      latestAvailablePeriod: "2026-01-01",
      isOfficial: true,
    },
  });

  // --- Eurostat source dataset (gov_10q_ggdebt) ---
  await prisma.sourceDataset.upsert({
    where: { organisationId_code: { organisationId: eurostat.id, code: "gov_10q_ggdebt" } },
    update: {},
    create: {
      organisationId: eurostat.id,
      code: "gov_10q_ggdebt",
      name: "Government consolidated gross debt (quarterly)",
      landingPageUrl: "https://ec.europa.eu/eurostat/databrowser/view/gov_10q_ggdebt",
      apiUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10q_ggdebt",
      dataFormat: "JSON-stat 2.0",
      frequency: "QUARTERLY",
      licence: "CC BY 4.0",
      attributionText: "Eurostat, gov_10q_ggdebt",
      accountingFrameworkId: edp.id,
      isOfficial: true,
    },
  });

  // --- Eurostat source dataset (gov_10a_main) ---
  await prisma.sourceDataset.upsert({
    where: { organisationId_code: { organisationId: eurostat.id, code: "gov_10a_main" } },
    update: {},
    create: {
      organisationId: eurostat.id,
      code: "gov_10a_main",
      name: "Government revenue, expenditure and main aggregates",
      landingPageUrl: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main",
      apiUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_main",
      dataFormat: "JSON-stat 2.0",
      frequency: "ANNUAL",
      licence: "CC BY 4.0",
      attributionText: "Eurostat, gov_10a_main",
      accountingFrameworkId: (await prisma.accountingFramework.findUniqueOrThrow({ where: { code: "ESA2010" } })).id,
      firstAvailablePeriod: "1975",
      isOfficial: true,
    },
  });

  // --- Eurostat source dataset (gov_10a_exp — COFOG functional expenditure) ---
  await prisma.sourceDataset.upsert({
    where: { organisationId_code: { organisationId: eurostat.id, code: "gov_10a_exp" } },
    update: {},
    create: {
      organisationId: eurostat.id,
      code: "gov_10a_exp",
      name: "General government expenditure by function (COFOG)",
      landingPageUrl: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp",
      apiUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp",
      dataFormat: "JSON-stat 2.0",
      frequency: "ANNUAL",
      licence: "CC BY 4.0",
      attributionText: "Eurostat, gov_10a_exp",
      accountingFrameworkId: (await prisma.accountingFramework.findUniqueOrThrow({ where: { code: "COFOG" } })).id,
      firstAvailablePeriod: "1990",
      isOfficial: true,
    },
  });

  // --- Eurostat source dataset (gov_10a_taxag — main national accounts tax aggregates) ---
  // Dataset code verified live against the Eurostat dissemination API on 2026-09-19
  // (catalogue TOC + a live gov_10a_taxag?geo=BE&sector=S13 query), not assumed.
  await prisma.sourceDataset.upsert({
    where: { organisationId_code: { organisationId: eurostat.id, code: "gov_10a_taxag" } },
    update: {},
    create: {
      organisationId: eurostat.id,
      code: "gov_10a_taxag",
      name: "Main national accounts tax aggregates",
      landingPageUrl: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_taxag",
      apiUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_taxag",
      dataFormat: "JSON-stat 2.0",
      frequency: "ANNUAL",
      licence: "CC BY 4.0",
      attributionText: "Eurostat, gov_10a_taxag",
      accountingFrameworkId: (await prisma.accountingFramework.findUniqueOrThrow({ where: { code: "ESA2010" } })).id,
      firstAvailablePeriod: "1995",
      isOfficial: true,
    },
  });

  // --- NBB source dataset (DF_NFGOV_DISS — annual non-financial government account) ---
  // Endpoint/coverage confirmed live on 2026-09-19, see docs/NBB_DATA_DISCOVERY.md.
  await prisma.sourceDataset.upsert({
    where: { organisationId_code: { organisationId: nbb.id, code: "DF_NFGOV_DISS" } },
    update: {},
    create: {
      organisationId: nbb.id,
      code: "DF_NFGOV_DISS",
      name: "Non-financial account of the government – overview",
      description:
        "Annual revenue, expenditure and net lending/borrowing (and components) for Belgian general government and its S1311/S1312/S1313/S1314 subsectors, agency BE2.",
      apiUrl: "https://nsidisseminate-stat.nbb.be/rest/data/BE2,DF_NFGOV_DISS,1.0",
      dataFormat: "SDMX-CSV",
      frequency: "ANNUAL",
      licence: "NBB.Stat terms of use",
      attributionText: "Nationale Bank van België, DF_NFGOV_DISS",
      accountingFrameworkId: (await prisma.accountingFramework.findUniqueOrThrow({ where: { code: "ESA2010" } })).id,
      firstAvailablePeriod: "1995",
      isOfficial: true,
    },
  });

  // --- NBB source dataset (DF_CGD — Maastricht-style consolidated gross debt) ---
  // Endpoint/coverage confirmed live on 2026-09-19, see docs/NBB_DATA_DISCOVERY.md.
  await prisma.sourceDataset.upsert({
    where: { organisationId_code: { organisationId: nbb.id, code: "DF_CGD" } },
    update: {},
    create: {
      organisationId: nbb.id,
      code: "DF_CGD",
      name: "Consolidated gross debt of general government",
      description:
        "Quarterly consolidated gross debt (Maastricht-style) for Belgian general government (S1300) and its S1311/S1312/S1313/S1314 subsectors, all-instruments aggregate, agency BE2. NBB's own CL_CGD_ITEM codelist labels this the subsector's 'contribution to the total consolidated gross debt'; the literal CONTRIB item codes return no data, so ITEM=CGD per GSECTOR is the working series.",
      apiUrl: "https://nsidisseminate-stat.nbb.be/rest/data/BE2,DF_CGD,1.0",
      dataFormat: "SDMX-CSV",
      frequency: "QUARTERLY",
      licence: "NBB.Stat terms of use",
      attributionText: "Nationale Bank van België, DF_CGD",
      accountingFrameworkId: (await prisma.accountingFramework.findUniqueOrThrow({ where: { code: "ESA2010" } })).id,
      firstAvailablePeriod: "1998-Q4",
      isOfficial: true,
    },
  });

  // --- Derivation definitions (computed on read, never persisted as Observations) ---
  const governmentDebtMetric = await prisma.metric.findUniqueOrThrow({ where: { code: "government_debt" } });
  const populationMetric = await prisma.metric.findUniqueOrThrow({ where: { code: "population" } });
  const debtPerCapita = await prisma.derivationDefinition.upsert({
    where: { code: "DEBT_PER_CAPITA" },
    update: {},
    create: {
      code: "DEBT_PER_CAPITA",
      name: "Schuld per inwoner",
      description:
        "Overheidsschuld gedeeld door de bevolking. Bevolking wordt gemeten op 1 januari; de schuld is doorgaans per kwartaal. De bevolkingswaarde van het kalenderjaar van de schuldperiode wordt gebruikt (zie src/data/derivations/debt-per-capita.ts voor de exacte matching-regel).",
      formulaDescription: "government_debt / population, matched on the population observation's calendar year",
    },
  });
  for (const [metricId, role] of [
    [governmentDebtMetric.id, "numerator"],
    [populationMetric.id, "denominator"],
  ] as const) {
    const existing = await prisma.derivationInput.findFirst({ where: { derivationDefinitionId: debtPerCapita.id, role } });
    if (!existing) {
      await prisma.derivationInput.create({ data: { derivationDefinitionId: debtPerCapita.id, metricId, role } });
    }
  }

  console.log("Seed complete.");
}

async function upsertEntity(input: {
  slug: string;
  name: string;
  officialName?: string;
  entityType:
    | "COUNTRY"
    | "GENERAL_GOVERNMENT"
    | "FEDERAL_GOVERNMENT"
    | "COMMUNITY"
    | "REGION"
    | "COMMUNITY_REGION"
    | "SOCIAL_SECURITY"
    | "PROVINCE"
    | "MUNICIPALITY";
  parentId?: string;
  regionCode?: string;
  countryCode?: string;
  statisticalSectorId?: string;
}) {
  return prisma.governmentEntity.upsert({
    where: { slug: input.slug },
    update: {},
    create: {
      slug: input.slug,
      name: input.name,
      officialName: input.officialName,
      entityType: input.entityType,
      parentId: input.parentId,
      regionCode: input.regionCode,
      countryCode: input.countryCode ?? "BE",
      statisticalSectorId: input.statisticalSectorId,
    },
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
