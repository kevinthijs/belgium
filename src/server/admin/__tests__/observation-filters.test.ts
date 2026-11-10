import { describe, expect, it } from "vitest";
import { buildObservationWhere } from "../observation-filters";

describe("buildObservationWhere", () => {
  it("matches everything when no filters are supplied", () => {
    expect(buildObservationWhere({})).toEqual({});
  });

  it("only includes clauses for filters that were actually supplied", () => {
    const where = buildObservationWhere({ metricId: "m1", status: "FINAL" });
    expect(where).toEqual({ metricId: "m1", status: "FINAL" });
  });

  it("maps datasetId onto the sourceId column", () => {
    const where = buildObservationWhere({ datasetId: "ds1" });
    expect(where).toEqual({ sourceId: "ds1" });
  });

  it("maps sectorId onto a nested entity.statisticalSectorId filter", () => {
    const where = buildObservationWhere({ sectorId: "sec1" });
    expect(where).toEqual({ entity: { statisticalSectorId: "sec1" } });
  });

  it("includes isDemoData: false explicitly when set, distinguishing it from 'unset'", () => {
    const where = buildObservationWhere({ isDemoData: false });
    expect(where).toEqual({ isDemoData: false });
  });

  it("combines every supplied filter", () => {
    const where = buildObservationWhere({
      entityId: "e1",
      metricId: "m1",
      periodId: "p1",
      datasetId: "d1",
      unitId: "u1",
      quality: "OFFICIAL_FINAL",
    });
    expect(where).toEqual({
      entityId: "e1",
      metricId: "m1",
      periodId: "p1",
      sourceId: "d1",
      unitId: "u1",
      qualityStatus: "OFFICIAL_FINAL",
    });
  });
});
