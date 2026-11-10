import Decimal from "decimal.js";
import type { SdmxCsvObservation } from "./sdmx-types";

/**
 * Parses NBB.Stat's SDMX-CSV data response
 * (`DATAFLOW,<dimension columns...>,TIME_PERIOD,OBS_VALUE,OBS_STATUS,CONF_STATUS,UNIT_MULT,DECIMALS`).
 *
 * Deliberately dimension-agnostic: whatever columns appear between
 * `DATAFLOW` and `TIME_PERIOD` in the header are treated as dimension
 * columns, so the same parser works for any NBB dataflow's CSV shape, not
 * just DF_NFGOV_DISS. Monetary values are read as raw strings and only
 * ever converted via `Decimal`, never through an intermediate JS Number.
 */

const KNOWN_NON_DIMENSION_COLUMNS = new Set([
  "DATAFLOW",
  "TIME_PERIOD",
  "OBS_VALUE",
  "OBS_STATUS",
  "CONF_STATUS",
  "UNIT_MULT",
  "DECIMALS",
]);

/** Splits one CSV line respecting double-quoted fields (NBB values are not
 * expected to contain embedded commas, but this keeps the parser correct
 * if a label ever does). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export class NbbCsvParser {
  /** Parses a raw SDMX-CSV payload into a deterministic, ordered list of observations. */
  parse(csvText: string): SdmxCsvObservation[] {
    const lines = csvText.split(/\r?\n/).filter((line) => line.length > 0);
    if (lines.length === 0) return [];

    const header = splitCsvLine(lines[0] ?? "").map((h) => h.trim());
    const dimensionColumns = header.filter((h) => !KNOWN_NON_DIMENSION_COLUMNS.has(h));

    const observations: SdmxCsvObservation[] = [];
    for (const line of lines.slice(1)) {
      const fields = splitCsvLine(line);
      const row: Record<string, string> = {};
      header.forEach((column, index) => {
        row[column] = (fields[index] ?? "").trim();
      });

      const dimensions: Record<string, string> = {};
      for (const column of dimensionColumns) {
        if (row[column]) dimensions[column] = row[column];
      }

      observations.push({
        dimensions,
        timePeriod: row.TIME_PERIOD ?? "",
        obsValue: !row.OBS_VALUE ? undefined : row.OBS_VALUE,
        obsStatus: row.OBS_STATUS || undefined,
        confStatus: row.CONF_STATUS || undefined,
        unitMult: row.UNIT_MULT || undefined,
        decimals: row.DECIMALS || undefined,
      });
    }
    return observations;
  }

  /**
   * Decimal-safe value extraction, applying `UNIT_MULT` scaling (e.g.
   * UNIT_MULT=6 means the raw OBS_VALUE is expressed in units and must be
   * multiplied by 10^6 to reach the millions-of-euro figures the rest of
   * the platform expects for EUR_MILLION amounts). Returns null for
   * missing/non-numeric values rather than throwing, since NBB CSV rows
   * can have deliberately empty OBS_VALUE (e.g. confidential cells).
   */
  toDecimalValue(observation: SdmxCsvObservation, expectedUnitMultiplier: number): Decimal | null {
    if (observation.obsValue === undefined) return null;
    let value: Decimal;
    try {
      value = new Decimal(observation.obsValue);
    } catch {
      return null;
    }
    const unitMult = observation.unitMult !== undefined ? Number(observation.unitMult) : expectedUnitMultiplier;
    if (Number.isFinite(unitMult) && unitMult !== expectedUnitMultiplier) {
      // Rescale to the caller's expected magnitude (e.g. millions) instead
      // of assuming UNIT_MULT is always absent or always matches.
      const rawUnits = value.mul(new Decimal(10).pow(unitMult));
      return rawUnits.div(new Decimal(10).pow(expectedUnitMultiplier));
    }
    return value;
  }
}
