import { describe, expect, it } from "vitest";
import snapshot from "../country-comparison-snapshot.json";
import { comparisonCountries } from "../country-comparison";

describe("reviewed country comparison source reconciliation", () => {
  it("uses the right country, unit and COFOG function from the archived Eurostat response", () => {
    const raw = snapshot.rawSources.eurostatSpending;
    const unitIndex = raw.id.indexOf("unit");
    const functionIndex = raw.id.indexOf("cofog99");
    const geoIndex = raw.id.indexOf("geo");
    function sourceValue(countryCode: string, unit: string, cofog: string): number {
      const positions = raw.id.map((_, index) => {
        if (index === unitIndex) return (raw.dimension.unit.category.index as Record<string, number>)[unit]!;
        if (index === functionIndex) return (raw.dimension.cofog99.category.index as Record<string, number>)[cofog]!;
        if (index === geoIndex) return (raw.dimension.geo.category.index as Record<string, number>)[countryCode]!;
        return 0;
      });
      const offset = positions.reduce((acc, position, index) => acc * raw.size[index]! + position, 0);
      return (raw.value as Record<string, number>)[String(offset)]!;
    }
    for (const country of comparisonCountries) {
      expect(country.educationEUR2024).toBe(sourceValue(country.code, "MIO_EUR", "GF09") * 1_000_000);
      expect(country.defenceEUR2024).toBe(sourceValue(country.code, "MIO_EUR", "GF02") * 1_000_000);
      expect(country.educationPercentGDP2024).toBe(sourceValue(country.code, "PC_GDP", "GF09"));
      expect(country.defencePercentGDP2024).toBe(sourceValue(country.code, "PC_GDP", "GF02"));
    }
  });

  it("uses government employment as a share of employment from the same OECD year", () => {
    const [header, ...lines] = snapshot.rawSources.oecdPublicEmploymentCSV.trim().split(/\r?\n/);
    const names = header!.split(",");
    const rows = lines.map((line) => Object.fromEntries(line.split(",").map((value, i) => [names[i], value])));
    const codes: Record<string, string> = { BE: "BEL", FR: "FRA", ES: "ESP", NL: "NLD" };
    for (const country of comparisonCountries) {
      const row = rows.find((item) => item.REF_AREA === codes[country.code]);
      expect(row).toBeDefined();
      expect(row!.TIME_PERIOD).toBe("2023");
      expect(row!.SECTOR).toBe("S13");
      expect(row!.UNIT_MEASURE).toBe("PT_EMP");
      expect(Number(row!.OBS_VALUE)).toBe(country.generalGovernmentEmploymentPercent2023);
    }
  });
});
