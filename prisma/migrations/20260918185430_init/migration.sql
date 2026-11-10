-- CreateEnum
CREATE TYPE "GovernmentEntityType" AS ENUM ('COUNTRY', 'GENERAL_GOVERNMENT', 'FEDERAL_GOVERNMENT', 'COMMUNITY', 'REGION', 'COMMUNITY_REGION', 'SOCIAL_SECURITY', 'PROVINCE', 'MUNICIPALITY', 'CPAS_OCMW', 'DISTRICT', 'INTERCOMMUNAL', 'PUBLIC_AGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "EntityRelationshipType" AS ENUM ('PREDECESSOR_OF', 'SUCCESSOR_OF', 'MERGED_INTO', 'SPLIT_FROM');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('YEAR', 'QUARTER', 'MONTH', 'DATE');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('STOCK', 'FLOW', 'RATIO', 'COUNT', 'INDEX');

-- CreateEnum
CREATE TYPE "AggregationMethod" AS ENUM ('SUM', 'AVERAGE', 'LAST_VALUE', 'NONE');

-- CreateEnum
CREATE TYPE "AccountingFrameworkCode" AS ENUM ('ESA2010', 'EDP_MAASTRICHT', 'BBC_FLANDERS', 'WALLOON_LOCAL_ACCOUNTING', 'BRUSSELS_ACCOUNTING', 'FEDERAL_BUDGET_ACCOUNTING', 'COFOG', 'OTHER');

-- CreateEnum
CREATE TYPE "DataFrequency" AS ENUM ('ANNUAL', 'QUARTERLY', 'MONTHLY', 'IRREGULAR');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('BUDGET', 'ADJUSTED_BUDGET', 'PROVISIONAL', 'FINAL', 'ESTIMATE', 'FORECAST');

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('OFFICIAL_FINAL', 'OFFICIAL_PROVISIONAL', 'OFFICIAL_BUDGET', 'OFFICIAL_FORECAST', 'DERIVED', 'ESTIMATED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConsolidationStatus" AS ENUM ('UNCONSOLIDATED', 'PARTIALLY_CONSOLIDATED', 'CONSOLIDATED', 'NOT_APPLICABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DebtEstimateCalculationType" AS ENUM ('LINEAR_RECENT_DEBT_CHANGE', 'LINEAR_FISCAL_FORECAST', 'CUSTOM_MODEL');

-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "GovernmentEntity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "shortName" TEXT,
    "entityType" "GovernmentEntityType" NOT NULL,
    "parentId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'BE',
    "regionCode" TEXT,
    "provinceCode" TEXT,
    "nisCode" TEXT,
    "nutsCode" TEXT,
    "ovoCode" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statisticalSectorId" TEXT,

    CONSTRAINT "GovernmentEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatisticalSector" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,

    CONSTRAINT "StatisticalSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalEntityIdentifier" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scheme" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "ExternalEntityIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityRelationship" (
    "id" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "relationshipType" "EntityRelationshipType" NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT,
    "notes" TEXT,

    CONSTRAINT "EntityRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeBoundary" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "boundaryVersion" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "geometryRef" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "AdministrativeBoundary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatisticalPeriod" (
    "id" TEXT NOT NULL,
    "periodType" "PeriodType" NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "month" INTEGER,
    "referenceDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "StatisticalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metricType" "MetricType" NOT NULL,
    "defaultUnitId" TEXT,
    "aggregationMethod" "AggregationMethod" NOT NULL DEFAULT 'NONE',
    "directionMeaning" TEXT,
    "isFinancial" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "scaleFactor" DECIMAL(20,6) NOT NULL DEFAULT 1,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationSystem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ClassificationSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationItem" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "ClassificationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingFramework" (
    "id" TEXT NOT NULL,
    "code" "AccountingFrameworkCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "AccountingFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceOrganisation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "licenceUrl" TEXT,
    "defaultLicence" TEXT,
    "notes" TEXT,

    CONSTRAINT "SourceOrganisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDataset" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "landingPageUrl" TEXT,
    "apiUrl" TEXT,
    "metadataUrl" TEXT,
    "dataFormat" TEXT,
    "frequency" "DataFrequency" NOT NULL DEFAULT 'IRREGULAR',
    "licence" TEXT,
    "attributionText" TEXT,
    "firstAvailablePeriod" TEXT,
    "latestAvailablePeriod" TEXT,
    "accountingFrameworkId" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "lastChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "classificationItemId" TEXT,
    "accountingFrameworkId" TEXT,
    "value" DECIMAL(24,6) NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" "ObservationStatus" NOT NULL,
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "consolidationStatus" "ConsolidationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "sourceId" TEXT NOT NULL,
    "sourceDimensions" JSONB,
    "isDemoData" BOOLEAN NOT NULL DEFAULT false,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "revisedAt" TIMESTAMP(3),
    "currentRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservationRevision" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "previousValue" DECIMAL(24,6),
    "newValue" DECIMAL(24,6) NOT NULL,
    "sourceVersion" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "importRunId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservationRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntergovernmentalTransfer" (
    "id" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "classificationItemId" TEXT,
    "value" DECIMAL(24,6) NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" "ObservationStatus" NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "IntergovernmentalTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DerivationDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formulaDescription" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "outputMetricId" TEXT,

    CONSTRAINT "DerivationDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DerivationInput" (
    "id" TEXT NOT NULL,
    "derivationDefinitionId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "DerivationInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtEstimateModel" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "referenceObservationId" TEXT NOT NULL,
    "methodologyVersion" INTEGER NOT NULL DEFAULT 1,
    "calculationType" "DebtEstimateCalculationType" NOT NULL,
    "annualizedChange" DECIMAL(24,6),
    "dailyChange" DECIMAL(24,6),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "sourceObservations" JSONB NOT NULL,
    "methodologyDescription" TEXT NOT NULL,
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'ESTIMATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtEstimateModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ImportRunStatus" NOT NULL DEFAULT 'RUNNING',
    "sourceLastModified" TIMESTAMP(3),
    "sourceVersion" TEXT,
    "sourceChecksum" TEXT,
    "recordsReceived" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsUnchanged" INTEGER NOT NULL DEFAULT 0,
    "recordsRejected" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB,
    "errors" JSONB,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnmappedSourceValue" (
    "id" TEXT NOT NULL,
    "importRunId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "context" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "UnmappedSourceValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawSourceSnapshot" (
    "id" TEXT NOT NULL,
    "importRunId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageRef" TEXT NOT NULL,

    CONSTRAINT "RawSourceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentEntity_slug_key" ON "GovernmentEntity"("slug");

-- CreateIndex
CREATE INDEX "GovernmentEntity_entityType_idx" ON "GovernmentEntity"("entityType");

-- CreateIndex
CREATE INDEX "GovernmentEntity_parentId_idx" ON "GovernmentEntity"("parentId");

-- CreateIndex
CREATE INDEX "GovernmentEntity_nisCode_idx" ON "GovernmentEntity"("nisCode");

-- CreateIndex
CREATE UNIQUE INDEX "StatisticalSector_code_key" ON "StatisticalSector"("code");

-- CreateIndex
CREATE INDEX "ExternalEntityIdentifier_scheme_value_idx" ON "ExternalEntityIdentifier"("scheme", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalEntityIdentifier_scheme_value_entityId_key" ON "ExternalEntityIdentifier"("scheme", "value", "entityId");

-- CreateIndex
CREATE INDEX "EntityRelationship_fromEntityId_idx" ON "EntityRelationship"("fromEntityId");

-- CreateIndex
CREATE INDEX "EntityRelationship_toEntityId_idx" ON "EntityRelationship"("toEntityId");

-- CreateIndex
CREATE INDEX "AdministrativeBoundary_entityId_idx" ON "AdministrativeBoundary"("entityId");

-- CreateIndex
CREATE INDEX "StatisticalPeriod_year_idx" ON "StatisticalPeriod"("year");

-- CreateIndex
CREATE UNIQUE INDEX "StatisticalPeriod_periodType_year_quarter_month_key" ON "StatisticalPeriod"("periodType", "year", "quarter", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Metric_code_key" ON "Metric"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassificationSystem_code_key" ON "ClassificationSystem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassificationItem_systemId_code_key" ON "ClassificationItem"("systemId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingFramework_code_key" ON "AccountingFramework"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SourceOrganisation_code_key" ON "SourceOrganisation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDataset_organisationId_code_key" ON "SourceDataset"("organisationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_currentRevisionId_key" ON "Observation"("currentRevisionId");

-- CreateIndex
CREATE INDEX "Observation_entityId_metricId_idx" ON "Observation"("entityId", "metricId");

-- CreateIndex
CREATE INDEX "Observation_periodId_idx" ON "Observation"("periodId");

-- CreateIndex
CREATE INDEX "Observation_metricId_periodId_idx" ON "Observation"("metricId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_entityId_metricId_periodId_classificationItemId_key" ON "Observation"("entityId", "metricId", "periodId", "classificationItemId", "accountingFrameworkId", "sourceId");

-- CreateIndex
CREATE INDEX "ObservationRevision_observationId_idx" ON "ObservationRevision"("observationId");

-- CreateIndex
CREATE INDEX "IntergovernmentalTransfer_fromEntityId_toEntityId_periodId_idx" ON "IntergovernmentalTransfer"("fromEntityId", "toEntityId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "DerivationDefinition_code_key" ON "DerivationDefinition"("code");

-- CreateIndex
CREATE INDEX "UnmappedSourceValue_importRunId_idx" ON "UnmappedSourceValue"("importRunId");

-- CreateIndex
CREATE INDEX "UnmappedSourceValue_dimension_rawValue_idx" ON "UnmappedSourceValue"("dimension", "rawValue");

-- AddForeignKey
ALTER TABLE "GovernmentEntity" ADD CONSTRAINT "GovernmentEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GovernmentEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentEntity" ADD CONSTRAINT "GovernmentEntity_statisticalSectorId_fkey" FOREIGN KEY ("statisticalSectorId") REFERENCES "StatisticalSector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatisticalSector" ADD CONSTRAINT "StatisticalSector_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StatisticalSector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEntityIdentifier" ADD CONSTRAINT "ExternalEntityIdentifier_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceDataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeBoundary" ADD CONSTRAINT "AdministrativeBoundary_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_defaultUnitId_fkey" FOREIGN KEY ("defaultUnitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationItem" ADD CONSTRAINT "ClassificationItem_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "ClassificationSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationItem" ADD CONSTRAINT "ClassificationItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ClassificationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceDataset" ADD CONSTRAINT "SourceDataset_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "SourceOrganisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceDataset" ADD CONSTRAINT "SourceDataset_accountingFrameworkId_fkey" FOREIGN KEY ("accountingFrameworkId") REFERENCES "AccountingFramework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "StatisticalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_classificationItemId_fkey" FOREIGN KEY ("classificationItemId") REFERENCES "ClassificationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_accountingFrameworkId_fkey" FOREIGN KEY ("accountingFrameworkId") REFERENCES "AccountingFramework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationRevision" ADD CONSTRAINT "ObservationRevision_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationRevision" ADD CONSTRAINT "ObservationRevision_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntergovernmentalTransfer" ADD CONSTRAINT "IntergovernmentalTransfer_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntergovernmentalTransfer" ADD CONSTRAINT "IntergovernmentalTransfer_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntergovernmentalTransfer" ADD CONSTRAINT "IntergovernmentalTransfer_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "StatisticalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntergovernmentalTransfer" ADD CONSTRAINT "IntergovernmentalTransfer_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntergovernmentalTransfer" ADD CONSTRAINT "IntergovernmentalTransfer_classificationItemId_fkey" FOREIGN KEY ("classificationItemId") REFERENCES "ClassificationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntergovernmentalTransfer" ADD CONSTRAINT "IntergovernmentalTransfer_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntergovernmentalTransfer" ADD CONSTRAINT "IntergovernmentalTransfer_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivationDefinition" ADD CONSTRAINT "DerivationDefinition_outputMetricId_fkey" FOREIGN KEY ("outputMetricId") REFERENCES "Metric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivationInput" ADD CONSTRAINT "DerivationInput_derivationDefinitionId_fkey" FOREIGN KEY ("derivationDefinitionId") REFERENCES "DerivationDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivationInput" ADD CONSTRAINT "DerivationInput_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtEstimateModel" ADD CONSTRAINT "DebtEstimateModel_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "GovernmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtEstimateModel" ADD CONSTRAINT "DebtEstimateModel_referenceObservationId_fkey" FOREIGN KEY ("referenceObservationId") REFERENCES "Observation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "SourceDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnmappedSourceValue" ADD CONSTRAINT "UnmappedSourceValue_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawSourceSnapshot" ADD CONSTRAINT "RawSourceSnapshot_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
