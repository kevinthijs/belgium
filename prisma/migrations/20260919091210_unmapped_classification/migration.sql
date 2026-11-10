-- CreateEnum
CREATE TYPE "UnmappedCategory" AS ENUM ('UNEXPECTED', 'EXPECTED_UNSUPPORTED', 'HISTORICAL_ENTITY', 'MISSING_CANONICAL_ENTITY', 'MISSING_CLASSIFICATION', 'MISSING_METRIC_MAPPING', 'MISSING_UNIT_MAPPING', 'INVALID_SOURCE_VALUE', 'SOURCE_SCHEMA_CHANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "UnmappedSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UnmappedStatus" AS ENUM ('OPEN', 'REVIEWED', 'IGNORED_EXPECTED', 'RESOLVED');

-- AlterTable
ALTER TABLE "UnmappedSourceValue" ADD COLUMN     "category" "UnmappedCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "severity" "UnmappedSeverity" NOT NULL DEFAULT 'WARNING',
ADD COLUMN     "status" "UnmappedStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "UnmappedSourceValue_category_idx" ON "UnmappedSourceValue"("category");

-- CreateIndex
CREATE INDEX "UnmappedSourceValue_severity_idx" ON "UnmappedSourceValue"("severity");

-- CreateIndex
CREATE INDEX "UnmappedSourceValue_status_idx" ON "UnmappedSourceValue"("status");
