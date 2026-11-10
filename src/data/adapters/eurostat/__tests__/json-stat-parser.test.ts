import { describe, expect, it } from "vitest";
import { parseJsonStatDataset, type JsonStatDataset } from "../json-stat-parser";

function buildDataset(overrides: Partial<JsonStatDataset> = {}): JsonStatDataset {
  return {
    class: "dataset",
    id: ["geo", "time"],
    size: [2, 3],
    dimension: {
      geo: { label: "geo", category: { index: { BE: 0, NL: 1 }, label: { BE: "Belgium", NL: "Netherlands" } } },
      time: {
        label: "time",
        category: { index: { "2024": 0, "2025": 1, "2026": 2 }, label: { "2024": "2024", "2025": "2025", "2026": "2026" } },
      },
    },
    value: {},
    ...overrides,
  };
}

describe("parseJsonStatDataset", () => {
  it("resolves dimension category codes in row-major order (last dimension fastest)", () => {
    const dataset = buildDataset({
      value: { 0: 100, 1: 101, 2: 102, 3: 200, 4: 201, 5: 202 },
    });

    const cells = parseJsonStatDataset(dataset);

    expect(cells).toHaveLength(6);
    expect(cells[0]).toEqual({ dimensions: { geo: "BE", time: "2024" }, value: 100, status: undefined });
    expect(cells[2]).toEqual({ dimensions: { geo: "BE", time: "2026" }, value: 102, status: undefined });
    expect(cells[3]).toEqual({ dimensions: { geo: "NL", time: "2024" }, value: 200, status: undefined });
  });

  it("skips null/missing cells rather than fabricating a value", () => {
    const dataset = buildDataset({ value: { 0: 100, 2: 102 } });
    const cells = parseJsonStatDataset(dataset);
    expect(cells).toHaveLength(2);
  });

  it("supports dense array-form value/status payloads", () => {
    const dataset = buildDataset({
      value: [100, null, 102, 200, 201, 202],
      status: ["", "", "p", "", "", "e"],
    });
    const cells = parseJsonStatDataset(dataset);
    expect(cells).toHaveLength(5);
    const belgium2026 = cells.find((c) => c.dimensions.geo === "BE" && c.dimensions.time === "2026");
    expect(belgium2026?.status).toBe("p");
  });

  it("throws when id/size length mismatch, instead of silently misaligning dimensions", () => {
    const dataset = buildDataset({ size: [2] });
    expect(() => parseJsonStatDataset(dataset)).toThrow();
  });
});
