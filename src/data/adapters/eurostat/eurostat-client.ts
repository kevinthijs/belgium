import crypto from "node:crypto";
import type { JsonStatDataset } from "./json-stat-parser";

const EUROSTAT_BASE_URL =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

export interface EurostatQueryOptions {
  /** Dimension filters, e.g. { geo: ["BE", "NL"], unit: ["MIO_EUR"] } */
  filters?: Record<string, string[]>;
  lang?: "EN" | "FR" | "DE";
  since?: Date;
}

/**
 * Thin wrapper around Eurostat's Statistics API (JSON-stat 2.0). Does not
 * hardcode dimension positions — everything is resolved by dimension id
 * against `dataset.dimension`, so this client works for any dataset code.
 */
export class EurostatClient {
  constructor(private readonly baseUrl: string = EUROSTAT_BASE_URL) {}

  buildUrl(datasetCode: string, options: EurostatQueryOptions = {}): string {
    const url = new URL(`${this.baseUrl}/${datasetCode}`);
    url.searchParams.set("format", "JSON");
    url.searchParams.set("lang", options.lang ?? "EN");
    if (options.since) {
      url.searchParams.set("updatedAfter", options.since.toISOString().slice(0, 10));
    }
    for (const [dim, values] of Object.entries(options.filters ?? {})) {
      for (const value of values) {
        url.searchParams.append(dim, value);
      }
    }
    return url.toString();
  }

  async fetchDataset(
    datasetCode: string,
    options: EurostatQueryOptions = {},
  ): Promise<{ dataset: JsonStatDataset; checksum: string; retrievedAt: Date }> {
    const url = this.buildUrl(datasetCode, options);
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(
        `Eurostat request failed for dataset "${datasetCode}": ${response.status} ${response.statusText}`,
      );
    }
    const text = await response.text();
    const checksum = crypto.createHash("sha256").update(text).digest("hex");
    const dataset = JSON.parse(text) as JsonStatDataset;
    return { dataset, checksum, retrievedAt: new Date() };
  }
}
