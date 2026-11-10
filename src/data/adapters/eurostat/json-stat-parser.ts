/**
 * Minimal JSON-stat 2.0 parser. Only implements what Eurostat's
 * Statistics API actually returns for a single-dataset response —
 * see https://json-stat.org/format/ for the full spec.
 */

export interface JsonStatDimensionCategory {
  index?: Record<string, number> | string[];
  label: Record<string, string>;
}

export interface JsonStatDimension {
  label: string;
  category: JsonStatDimensionCategory;
}

export interface JsonStatDataset {
  version?: string;
  class: "dataset";
  label?: string;
  href?: string;
  updated?: string;
  id: string[]; // dimension order
  size: number[]; // cardinality per dimension, matching `id` order
  dimension: Record<string, JsonStatDimension>;
  value: Record<string, number> | (number | null)[];
  status?: Record<string, string> | string[];
}

export interface JsonStatCell {
  /** Source-native dimension code per dimension id, e.g. { geo: "BE", time: "2025-Q1" } */
  dimensions: Record<string, string>;
  value: number | null;
  status?: string;
}

/**
 * Flattens a JSON-stat dataset into one row per observed cell, resolving
 * each dimension's positional index back to its category code. Dimension
 * *codes* are preserved verbatim (e.g. "BE", not "Belgium") so downstream
 * mapping can join against ExternalEntityIdentifier records.
 */
export function parseJsonStatDataset(dataset: JsonStatDataset): JsonStatCell[] {
  const dimensionIds = dataset.id;
  const sizes = dataset.size;

  if (dimensionIds.length !== sizes.length) {
    throw new Error("JSON-stat dataset: `id` and `size` length mismatch");
  }

  const categoryCodesByDimension = dimensionIds.map((dimId) => {
    const dim = dataset.dimension[dimId];
    if (!dim) {
      throw new Error(`JSON-stat dataset: missing dimension definition for "${dimId}"`);
    }
    return categoryCodesInOrder(dim.category);
  });

  const totalCells = sizes.reduce((a, b) => a * b, 1);
  const valueByIndex = normalizeValueArray(dataset.value, totalCells);
  const statusByIndex = normalizeStatusArray(dataset.status, totalCells);

  const cells: JsonStatCell[] = [];

  for (let flatIndex = 0; flatIndex < totalCells; flatIndex++) {
    const value = valueByIndex[flatIndex] ?? null;
    if (value === null || value === undefined) continue;

    const dims: Record<string, string> = {};
    let remainder = flatIndex;
    // JSON-stat uses row-major order with the last dimension varying fastest.
    for (let d = dimensionIds.length - 1; d >= 0; d--) {
      const size = sizes[d]!;
      const catIndex = remainder % size;
      remainder = Math.floor(remainder / size);
      const dimId = dimensionIds[d]!;
      const code = categoryCodesByDimension[d]![catIndex];
      if (code === undefined) {
        throw new Error(`JSON-stat dataset: no category code at index ${catIndex} for dimension "${dimId}"`);
      }
      dims[dimId] = code;
    }

    cells.push({
      dimensions: dims,
      value,
      status: statusByIndex?.[flatIndex],
    });
  }

  return cells;
}

function categoryCodesInOrder(category: JsonStatDimensionCategory): string[] {
  const { index } = category;
  if (Array.isArray(index)) return index;
  if (index && typeof index === "object") {
    return Object.entries(index)
      .sort((a, b) => a[1] - b[1])
      .map(([code]) => code);
  }
  // No explicit index (single-category dimension): fall back to label keys.
  return Object.keys(category.label);
}

function normalizeValueArray(
  value: Record<string, number> | (number | null)[],
  totalCells: number,
): (number | null)[] {
  if (Array.isArray(value)) return value;
  const out: (number | null)[] = new Array(totalCells).fill(null);
  for (const [key, v] of Object.entries(value)) {
    const idx = Number(key);
    if (Number.isInteger(idx)) out[idx] = v;
  }
  return out;
}

function normalizeStatusArray(
  status: Record<string, string> | string[] | undefined,
  totalCells: number,
): (string | undefined)[] | undefined {
  if (!status) return undefined;
  if (Array.isArray(status)) return status;
  const out: (string | undefined)[] = new Array(totalCells).fill(undefined);
  for (const [key, v] of Object.entries(status)) {
    const idx = Number(key);
    if (Number.isInteger(idx)) out[idx] = v;
  }
  return out;
}
