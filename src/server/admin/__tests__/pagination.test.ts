import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, resolvePageInput, toPageResult } from "../pagination";

describe("resolvePageInput", () => {
  it("defaults to page 1 and the default page size when nothing is supplied", () => {
    const result = resolvePageInput({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(DEFAULT_PAGE_SIZE);
  });

  it("computes skip from page and pageSize", () => {
    const result = resolvePageInput({ page: 3, pageSize: 20 });
    expect(result.skip).toBe(40);
    expect(result.take).toBe(20);
  });

  it("clamps page below 1 up to 1", () => {
    expect(resolvePageInput({ page: 0 }).page).toBe(1);
    expect(resolvePageInput({ page: -5 }).page).toBe(1);
  });

  it("clamps pageSize above MAX_PAGE_SIZE down to the max — never loads unbounded rows", () => {
    const result = resolvePageInput({ pageSize: 100000 });
    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it("clamps pageSize below 1 up to 1", () => {
    expect(resolvePageInput({ pageSize: 0 }).pageSize).toBe(1);
  });
});

describe("toPageResult", () => {
  it("computes totalPages by rounding up", () => {
    expect(toPageResult([], 101, 1, 50).totalPages).toBe(3);
    expect(toPageResult([], 100, 1, 50).totalPages).toBe(2);
    expect(toPageResult([], 0, 1, 50).totalPages).toBe(1);
  });

  it("preserves the items, total, page and pageSize passed in", () => {
    const items = [1, 2, 3];
    const result = toPageResult(items, 3, 2, 3);
    expect(result.items).toBe(items);
    expect(result.total).toBe(3);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(3);
  });
});
