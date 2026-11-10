/**
 * Reusable SDMX 2.1 structure model + XML parsing helpers for NBB.Stat.
 *
 * Deliberately generic — nothing here knows about DF_NFGOV_DISS or any
 * other specific dataflow. Dimension order is preserved exactly as
 * returned by the DSD (`position` attribute); callers must not assume a
 * fixed dimension order across dataflows (confirmed different DSDs exist
 * for e.g. DF_NFGOV_DISS vs DF_NFGOVQ_DISS, see docs/NBB_DATA_DISCOVERY.md).
 *
 * A regex-based parser is used instead of a full XML/DOM library because
 * the NBB structure responses are large (100+ codelists per response) and
 * we only need a handful of well-formed, non-nested element shapes out of
 * them — this mirrors the approach already validated during the discovery
 * phase against live responses. `[\s\S]*?` is used instead of the regex
 * dotAll (`s`) flag so this compiles under the project's ES2017 target.
 */

export interface SdmxDataflow {
  id: string;
  agencyId: string;
  version: string;
  name: string;
  dataStructureId: string;
}

export interface SdmxDimension {
  id: string;
  position: number;
  codelistId?: string;
}

export interface SdmxDataStructure {
  id: string;
  dimensions: SdmxDimension[];
  timeDimensionId?: string;
  primaryMeasureId?: string;
}

export interface SdmxCodeListItem {
  id: string;
  name: string;
}

export interface SdmxCodeList {
  id: string;
  items: SdmxCodeListItem[];
}

export interface SdmxStructure {
  dataflow: SdmxDataflow;
  dataStructure: SdmxDataStructure;
  codelists: Map<string, SdmxCodeList>;
}

/** A fully-qualified series identity: ordered dimension id -> code value. */
export type SeriesKey = Record<string, string>;

/** One raw SDMX-CSV observation row, columns preserved as received. */
export interface SdmxCsvObservation {
  dimensions: Record<string, string>;
  timePeriod: string;
  obsValue: string | undefined;
  obsStatus?: string;
  confStatus?: string;
  unitMult?: string;
  decimals?: string;
}

function extractName(block: string): string {
  // English name preferred; fall back to any language if EN is missing.
  const en = /<common:Name[^>]*xml:lang="en"[^>]*>([^<]*)<\/common:Name>/.exec(block);
  if (en?.[1] !== undefined) return en[1];
  const any = /<common:Name[^>]*>([^<]*)<\/common:Name>/.exec(block);
  return any?.[1] ?? "";
}

export function parseSdmxDataflow(xml: string): SdmxDataflow {
  const match = /<structure:Dataflow id="([^"]+)" agencyID="([^"]+)" version="([^"]+)"[^>]*>([\s\S]*?)<\/structure:Dataflow>/.exec(
    xml,
  );
  if (!match) throw new Error("SDMX structure response did not contain a <structure:Dataflow> element");
  const id = match[1] ?? "";
  const agencyId = match[2] ?? "";
  const version = match[3] ?? "";
  const body = match[4] ?? "";
  const structureRef = /<(?:structure:)?Structure>[\s\S]*?Ref id="([^"]+)"/.exec(body);
  return {
    id,
    agencyId,
    version,
    name: extractName(body),
    dataStructureId: structureRef?.[1] ?? id,
  };
}

export function parseSdmxDataStructure(xml: string): SdmxDataStructure {
  const match = /<structure:DataStructure id="([^"]+)"[^>]*>([\s\S]*?)<\/structure:DataStructure>/.exec(xml);
  if (!match) throw new Error("SDMX structure response did not contain a <structure:DataStructure> element");
  const id = match[1] ?? "";
  const body = match[2] ?? "";

  const dimensions: SdmxDimension[] = [];
  const dimensionPattern =
    /<structure:Dimension id="([^"]+)"[^>]*position="(\d+)"[^>]*>([\s\S]*?)<\/structure:Dimension>/g;
  let dimMatch: RegExpExecArray | null;
  while ((dimMatch = dimensionPattern.exec(body))) {
    const dimId = dimMatch[1] ?? "";
    const position = dimMatch[2] ?? "0";
    const dimBody = dimMatch[3] ?? "";
    const codelistRef = /<(?:structure:)?Enumeration>[\s\S]*?Ref id="([^"]+)"/.exec(dimBody);
    dimensions.push({ id: dimId, position: Number(position), codelistId: codelistRef?.[1] });
  }
  dimensions.sort((a, b) => a.position - b.position);

  const timeDimMatch = /<structure:TimeDimension id="([^"]+)"/.exec(body);
  const measureMatch = /<structure:PrimaryMeasure id="([^"]+)"/.exec(body);

  return {
    id,
    dimensions,
    timeDimensionId: timeDimMatch?.[1],
    primaryMeasureId: measureMatch?.[1],
  };
}

export function parseSdmxCodelists(xml: string): Map<string, SdmxCodeList> {
  const codelists = new Map<string, SdmxCodeList>();
  const codelistPattern = /<structure:Codelist id="([^"]+)"[^>]*>([\s\S]*?)<\/structure:Codelist>/g;
  let clMatch: RegExpExecArray | null;
  while ((clMatch = codelistPattern.exec(xml))) {
    const id = clMatch[1] ?? "";
    const body = clMatch[2] ?? "";
    const items: SdmxCodeListItem[] = [];
    const codePattern = /<structure:Code id="([^"]+)"[^>]*>([\s\S]*?)<\/structure:Code>/g;
    let codeMatch: RegExpExecArray | null;
    while ((codeMatch = codePattern.exec(body))) {
      const codeId = codeMatch[1] ?? "";
      const codeBody = codeMatch[2] ?? "";
      items.push({ id: codeId, name: extractName(codeBody) });
    }
    codelists.set(id, { id, items });
  }
  return codelists;
}

/** Parses the full `?references=all` structure response into one object. */
export function parseSdmxStructure(xml: string): SdmxStructure {
  return {
    dataflow: parseSdmxDataflow(xml),
    dataStructure: parseSdmxDataStructure(xml),
    codelists: parseSdmxCodelists(xml),
  };
}
