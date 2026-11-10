import * as XLSX from "xlsx";

/**
 * Statbel NIS codes: country (01000), the 3 regions (02000/03000/04000),
 * provinces and arrondissements all end in "000". Real municipality codes
 * never do — that's the only distinction needed to tell an aggregate row
 * from an actual municipality, straight from the source data itself
 * (never inferred from the label).
 */
const COUNTRY_NIS_CODE = "01000";
const REGION_NIS_CODES = new Set(["02000", "03000", "04000"]);

export type StatbelPopulationRowKind = "COUNTRY" | "REGION" | "OTHER_AGGREGATE" | "MUNICIPALITY";

export interface StatbelPopulationRow {
  nisCode: string;
  name: string;
  year: number;
  total: number;
  kind: StatbelPopulationRowKind;
  /** Nearest preceding region NIS code in the sheet — only set for MUNICIPALITY rows. */
  regionNisCode?: string;
}

const SHEET_NAME_PATTERN = /^Bevolking in (\d{4})$/;

/**
 * Parses every "Bevolking in <year>" sheet (1992-2026) in the "Bevolking
 * per gemeente op 1 januari" workbook. The older census sheets ("Census
 * 1991", "Census 1981", "Census 1970") use a different layout and are
 * intentionally skipped — they're out of scope for this import.
 */
export function parsePopulationWorkbook(buffer: Buffer): StatbelPopulationRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows: StatbelPopulationRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const match = SHEET_NAME_PATTERN.exec(sheetName);
    if (!match) continue;
    const year = Number(match[1]);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const headerIndex = sheetRows.findIndex((row) => row[0] === "NIS code");
    if (headerIndex === -1) {
      throw new Error(`Sheet "${sheetName}" is missing the expected "NIS code" header row`);
    }

    let currentRegionNisCode: string | undefined;
    for (const row of sheetRows.slice(headerIndex + 1)) {
      const rawNisCode = row[0];
      if (rawNisCode === null || rawNisCode === undefined || rawNisCode === "") continue;
      const nisCode = String(rawNisCode).padStart(5, "0");
      const name = String(row[1] ?? "");
      const total = row[4];
      if (typeof total !== "number") continue;

      const isAggregate = nisCode.endsWith("000");
      let kind: StatbelPopulationRowKind;
      if (nisCode === COUNTRY_NIS_CODE) {
        kind = "COUNTRY";
      } else if (REGION_NIS_CODES.has(nisCode)) {
        kind = "REGION";
        currentRegionNisCode = nisCode;
      } else if (isAggregate) {
        kind = "OTHER_AGGREGATE";
      } else {
        kind = "MUNICIPALITY";
      }

      rows.push({
        nisCode,
        name,
        year,
        total,
        kind,
        regionNisCode: kind === "MUNICIPALITY" ? currentRegionNisCode : undefined,
      });
    }
  }

  return rows;
}
