import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parsePopulationWorkbook } from "../population-xlsx-parser";

function buildFixtureWorkbook(): Buffer {
  const workbook = XLSX.utils.book_new();

  const sheetData = [
    ["Bevolking per gemeente op 1 januari 2026"],
    ["NIS code", "Woonplaats", "Mannen", "Vrouwen", "Totaal"],
    [],
    [],
    ["01000", "België", 5851157, 6016477, 11867634],
    ["02000", "Vlaams Gewest", 3416582, 3481768, 6898350],
    ["10000", "Provincie Antwerpen", 959323, 972568, 1931891],
    ["11000", "Arrondissement Antwerpen", 537245, 545460, 1082705],
    ["11001", "Aartselaar", 7531, 7554, 15085],
    ["11002", "Antwerpen", 283630, 281985, 565615],
    ["03000", "Waals Gewest", 1819567, 1893883, 3713450],
    ["50000", "Provincie Henegouwen", 640000, 660000, 1300000],
    ["51000", "Arrondissement Charleroi", 220000, 230000, 450000],
    ["52011", "Charleroi", 110000, 111000, 221000],
    ["04000", "Brussels Hoofdstedelijk Gewest", 615008, 640826, 1255834],
  ];

  const census1991 = [["Census 1991 has a different, unsupported layout"]];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetData), "Bevolking in 2026");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(census1991), "Census 1991");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("parsePopulationWorkbook", () => {
  const rows = parsePopulationWorkbook(buildFixtureWorkbook());

  it("only parses 'Bevolking in <year>' sheets, skipping census sheets", () => {
    expect(rows.every((r) => r.year === 2026)).toBe(true);
  });

  it("classifies the country row by NIS code, not by label", () => {
    const belgium = rows.find((r) => r.nisCode === "01000")!;
    expect(belgium.kind).toBe("COUNTRY");
    expect(belgium.total).toBe(11867634);
  });

  it("classifies region rows", () => {
    const flanders = rows.find((r) => r.nisCode === "02000")!;
    expect(flanders.kind).toBe("REGION");
  });

  it("classifies province/arrondissement aggregate rows as OTHER_AGGREGATE", () => {
    const province = rows.find((r) => r.nisCode === "10000")!;
    const arrondissement = rows.find((r) => r.nisCode === "11000")!;
    expect(province.kind).toBe("OTHER_AGGREGATE");
    expect(arrondissement.kind).toBe("OTHER_AGGREGATE");
  });

  it("classifies real municipality codes (not ending in 000) as MUNICIPALITY", () => {
    const aartselaar = rows.find((r) => r.nisCode === "11001")!;
    expect(aartselaar.kind).toBe("MUNICIPALITY");
    expect(aartselaar.name).toBe("Aartselaar");
    expect(aartselaar.total).toBe(15085);
  });

  it("tags each municipality with the nearest preceding region NIS code", () => {
    const aartselaar = rows.find((r) => r.nisCode === "11001")!;
    expect(aartselaar.regionNisCode).toBe("02000");

    const charleroi = rows.find((r) => r.nisCode === "52011")!;
    expect(charleroi.regionNisCode).toBe("03000");
  });
});
