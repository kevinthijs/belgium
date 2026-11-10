-- CreateIndex
CREATE INDEX "ImportRun_datasetId_startedAt_idx" ON "ImportRun"("datasetId", "startedAt");

-- CreateIndex
CREATE INDEX "ImportRun_status_idx" ON "ImportRun"("status");

-- CreateIndex
CREATE INDEX "Observation_sourceId_idx" ON "Observation"("sourceId");

-- CreateIndex
CREATE INDEX "ObservationRevision_importRunId_idx" ON "ObservationRevision"("importRunId");
