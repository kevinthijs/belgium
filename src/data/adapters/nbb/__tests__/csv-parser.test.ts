import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { NbbCsvParser } from "../csv-parser";

const SAMPLE_CSV = [
  "DATAFLOW,FREQ,GOVTYPE,ITEM,UNIT,TIME_PERIOD,OBS_VALUE,OBS_STATUS,CONF_STATUS,UNIT_MULT,DECIMALS",
  "BE2:DF_NFGOV_DISS(1.0),A,S1311,TOR,E,2023,150000.5,A,F,,1",
  "BE2:DF_NFGOV_DISS(1.0),A,S1311,TOR,E,2025,151000.2,P,F,,1",
  "BE2:DF_NFGOV_DISS(1.0),A,S1311,TOR,E,2009,,B,F,,1",
].join("\n");

describe("NbbCsvParser.parse", () => {
  const parser = new NbbCsvParser();

  it("treats header columns between DATAFLOW and TIME_PERIOD as dimension columns generically", () => {
    const rows = parser.parse(SAMPLE_CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0]!.dimensions).toEqual({ FREQ: "A", GOVTYPE: "S1311", ITEM: "TOR", UNIT: "E" });
  });

  it("is deterministic — same input always produces the same output order", () => {
    expect(parser.parse(SAMPLE_CSV)).toEqual(parser.parse(SAMPLE_CSV));
  });

  it("preserves raw status/period/unit fields without transformation", () => {
    const rows = parser.parse(SAMPLE_CSV);
    expect(rows[1]!).toMatchObject({ timePeriod: "2025", obsStatus: "P", confStatus: "F" });
  });

  it("treats an empty OBS_VALUE as undefined rather than '0'", () => {
    const rows = parser.parse(SAMPLE_CSV);
    expect(rows[2]!.obsValue).toBeUndefined();
  });

  it("returns an empty array for an empty payload", () => {
    expect(parser.parse("")).toEqual([]);
  });
});

describe("NbbCsvParser.toDecimalValue", () => {
  const parser = new NbbCsvParser();

  it("parses OBS_VALUE straight into a Decimal, never through a JS float", () => {
    const [row] = parser.parse(SAMPLE_CSV);
    const value = parser.toDecimalValue(row!, 6);
    expect(value).toBeInstanceOf(Decimal);
    expect(value!.toString()).toBe("150000.5");
  });

  it("returns null for a row with no OBS_VALUE", () => {
    const rows = parser.parse(SAMPLE_CSV);
    expect(parser.toDecimalValue(rows[2]!, 6)).toBeNull();
  });

  it("rescales the value when UNIT_MULT differs from the expected magnitude", () => {
    const csv = [
      "DATAFLOW,FREQ,ITEM,TIME_PERIOD,OBS_VALUE,OBS_STATUS,CONF_STATUS,UNIT_MULT,DECIMALS",
      "BE2:DF_CGD(1.0),Q,CGD,2025-Q4,692460000000,A,F,0,0",
    ].join("\n");
    const [row] = parser.parse(csv);
    // Raw value is in units (UNIT_MULT=0); caller expects millions (10^6).
    const value = parser.toDecimalValue(row!, 6);
    expect(value!.toString()).toBe("692460");
  });
});
