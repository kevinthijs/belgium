import crypto from "node:crypto";
import https from "node:https";
import { parseSdmxStructure, type SdmxStructure } from "./sdmx-types";

/**
 * Generic HTTP client for the live NBB.Stat SDMX 2.1 REST API
 * (`https://nsidisseminate-stat.nbb.be/rest`, agency `BE2`). Confirmed live
 * and working during the discovery phase — see docs/NBB_DATA_DISCOVERY.md.
 * The legacy `stat.nbb.be/RestSDMX` endpoint is dead and must never be used.
 *
 * Deliberately dataflow-agnostic: no dataflow ID, dimension code, or
 * metric mapping is hardcoded here. Dataset-specific logic belongs in
 * `NbbDatasetAdapter` and its per-dataflow configuration.
 */

const NBB_BASE_URL = "https://nsidisseminate-stat.nbb.be/rest";
const NBB_AGENCY_ID = "BE2";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

export class NbbSdmxError extends Error {
  constructor(
    message: string,
    readonly context: { url: string; status?: number; cause?: unknown },
  ) {
    super(message);
    this.name = "NbbSdmxError";
  }
}

export interface NbbFetchResult<T> {
  data: T;
  url: string;
  checksum: string;
  retrievedAt: Date;
  httpStatus: number;
}

export interface NbbDataQuery {
  /** Ordered dimension id -> one or more codes, matching the DSD's dimension
   * order. Omit a dimension (or pass an empty array) to leave it wildcarded. */
  key: Record<string, string[]>;
  /** Dimension order as returned by the DSD — required so the `.`-joined
   * key is built correctly (NBB does not accept dimension=value query params
   * for the data endpoint, only positional key segments). */
  dimensionOrder: string[];
  since?: Date;
}

interface HttpResponseLike {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
}

/**
 * NBB's edge WAF (F5 ASM, `TS...` cookie) fingerprints the TLS/HTTP client
 * and silently serves an HTML "NotAvailable" redirect page (with HTTP 200!)
 * to requests made via Node's global `fetch` (undici) — confirmed during
 * live testing, while the same URL succeeds via `curl` and via Node's
 * built-in `https` module. So NBB requests are made with `node:https`
 * directly rather than `fetch`, never assuming a 200 status means real data.
 */
function httpsGetOnce(url: string, headers: Record<string, string>, timeoutMs: number): Promise<HttpResponseLike> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const status = res.statusCode ?? 0;
        resolve({
          ok: status >= 200 && status < 300,
          status,
          statusText: res.statusMessage ?? "",
          text: async () => Buffer.concat(chunks).toString("utf-8"),
        });
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Request to "${url}" timed out after ${timeoutMs}ms`)));
  });
}

async function fetchWithRetry(
  url: string,
  init: { headers: Record<string, string> },
  { retries, timeoutMs }: { retries: number; timeoutMs: number },
): Promise<HttpResponseLike> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await httpsGetOnce(url, init.headers, timeoutMs);
      // Retry on 5xx (transient) but not on 4xx (a different key/URL won't help).
      if (response.status >= 500 && attempt < retries) {
        lastError = new NbbSdmxError(`NBB request failed with ${response.status}`, { url, status: response.status });
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** attempt));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** attempt));
        continue;
      }
    }
  }
  throw new NbbSdmxError(`NBB request failed after ${retries + 1} attempt(s)`, { url, cause: lastError });
}

export class NbbSdmxClient {
  constructor(
    private readonly baseUrl: string = NBB_BASE_URL,
    private readonly agencyId: string = NBB_AGENCY_ID,
    private readonly options: { timeoutMs?: number; retries?: number } = {},
  ) {}

  buildStructureUrl(dataflowId: string): string {
    return `${this.baseUrl}/dataflow/${this.agencyId}/${dataflowId}?references=all`;
  }

  buildDataUrl(dataflowId: string, dataflowVersion: string, query: NbbDataQuery): string {
    const keySegments = query.dimensionOrder.map((dimId) => (query.key[dimId] ?? []).join("+"));
    const key = keySegments.join(".");
    const url = new URL(`${this.baseUrl}/data/${this.agencyId},${dataflowId},${dataflowVersion}/${key}`);
    url.searchParams.set("format", "csv");
    if (query.since) {
      url.searchParams.set("updatedAfter", query.since.toISOString());
    }
    return url.toString();
  }

  /** Fetches dataflow + DSD + all referenced codelists in one call. */
  async fetchStructure(dataflowId: string): Promise<NbbFetchResult<SdmxStructure>> {
    const url = this.buildStructureUrl(dataflowId);
    const response = await this.request(url, "application/vnd.sdmx.structure+xml; version=2.1");
    const text = await response.text();
    if (isWafErrorPage(text)) {
      throw new NbbSdmxError(`NBB WAF returned an error page instead of the SDMX structure for "${dataflowId}"`, { url });
    }
    let parsed: SdmxStructure;
    try {
      parsed = parseSdmxStructure(text);
    } catch (error) {
      throw new NbbSdmxError(`Failed to parse SDMX structure for dataflow "${dataflowId}"`, { url, cause: error });
    }
    return {
      data: parsed,
      url,
      checksum: sha256(text),
      retrievedAt: new Date(),
      httpStatus: response.status,
    };
  }

  /** Fetches observations as raw CSV text (caller parses via `NbbCsvParser`). */
  async fetchDataCsv(
    dataflowId: string,
    dataflowVersion: string,
    query: NbbDataQuery,
  ): Promise<NbbFetchResult<string>> {
    const url = this.buildDataUrl(dataflowId, dataflowVersion, query);
    const response = await this.request(url, "text/csv");
    const text = await response.text();
    if (isWafErrorPage(text)) {
      throw new NbbSdmxError(`NBB WAF returned an error page instead of CSV data for "${dataflowId}"`, { url });
    }
    return {
      data: text,
      url,
      checksum: sha256(text),
      retrievedAt: new Date(),
      httpStatus: response.status,
    };
  }

  private async request(url: string, accept: string): Promise<HttpResponseLike> {
    const response = await fetchWithRetry(
      url,
      { headers: { Accept: accept } },
      { retries: this.options.retries ?? DEFAULT_RETRIES, timeoutMs: this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS },
    );
    if (!response.ok) {
      // NBB returns 404/"NoRecordsFound" for a structurally valid but empty
      // key (e.g. an ITEM code not populated for a given GOVTYPE) — callers
      // that expect this should catch NbbSdmxError and treat it as "no data",
      // not a hard failure.
      throw new NbbSdmxError(`NBB request failed for "${url}": ${response.status} ${response.statusText}`, {
        url,
        status: response.status,
      });
    }
    return response;
  }
}

/** Detects NBB's WAF error-redirect page, which is served with HTTP 200 and
 * so cannot be caught via status code alone — must be checked against the
 * actual body before treating a 200 response as real SDMX data. */
function isWafErrorPage(text: string): boolean {
  return text.includes("pub.nbb.be/api/inf/Error/NotAvailable.aspx");
}

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}
