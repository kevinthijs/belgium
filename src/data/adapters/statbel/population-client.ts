import crypto from "node:crypto";

/**
 * "Bevolking per gemeente op 1 januari" (1992-2026) — Statbel's official
 * municipality-level population workbook. One sheet per reference year,
 * each row is a NIS-coded entity (country/region/province/arrondissement/
 * municipality aggregate) with male/female/total counts on 1 January.
 *
 * https://statbel.fgov.be/nl/themas/bevolking/structuur-van-de-bevolking
 */
export const STATBEL_POPULATION_XLSX_URL =
  "https://statbel.fgov.be/sites/default/files/files/documents/bevolking/5.1%20Structuur%20van%20de%20bevolking/Bevolking_per_gemeente.xlsx";

export class StatbelPopulationClient {
  constructor(private readonly url: string = STATBEL_POPULATION_XLSX_URL) {}

  async fetchWorkbook(): Promise<{ buffer: Buffer; checksum: string; retrievedAt: Date }> {
    const response = await fetch(this.url);
    if (!response.ok) {
      throw new Error(`Statbel population request failed: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    return { buffer, checksum, retrievedAt: new Date() };
  }
}
