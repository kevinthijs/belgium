import { describe, expect, it } from "vitest";
import { parseSdmxDataflow, parseSdmxDataStructure, parseSdmxCodelists } from "../sdmx-types";

const SAMPLE_XML = `
<message:Structure xmlns:message="urn:sdmx:org.sdmx.infomodel.message" xmlns:structure="urn:sdmx:org.sdmx.infomodel.structure" xmlns:common="urn:sdmx:org.sdmx.infomodel.common">
  <message:Structures>
    <structure:Dataflows>
      <structure:Dataflow id="DF_NFGOV_DISS" agencyID="BE2" version="1.0">
        <common:Name xml:lang="en">Non-financial account of the government - overview</common:Name>
        <structure:Structure>
          <Ref id="DS_NFGOV_DISS" />
        </structure:Structure>
      </structure:Dataflow>
    </structure:Dataflows>
    <structure:DataStructures>
      <structure:DataStructure id="DS_NFGOV_DISS">
        <structure:DataStructureComponents>
          <structure:DimensionList>
            <structure:Dimension id="FREQ" position="1">
              <structure:LocalRepresentation>
                <structure:Enumeration>
                  <Ref id="CL_FREQ" />
                </structure:Enumeration>
              </structure:LocalRepresentation>
            </structure:Dimension>
            <structure:Dimension id="ITEM" position="3">
              <structure:LocalRepresentation>
                <structure:Enumeration>
                  <Ref id="CL_NACC_ITEM_DISS" />
                </structure:Enumeration>
              </structure:LocalRepresentation>
            </structure:Dimension>
            <structure:Dimension id="GOVTYPE" position="2">
              <structure:LocalRepresentation>
                <structure:Enumeration>
                  <Ref id="CL_NACC_GOVTYPE_DISS" />
                </structure:Enumeration>
              </structure:LocalRepresentation>
            </structure:Dimension>
            <structure:TimeDimension id="TIME_PERIOD" />
          </structure:DimensionList>
          <structure:MeasureList>
            <structure:PrimaryMeasure id="OBS_VALUE" />
          </structure:MeasureList>
        </structure:DataStructureComponents>
      </structure:DataStructure>
    </structure:DataStructures>
    <structure:Codelists>
      <structure:Codelist id="CL_NACC_GOVTYPE_DISS" agencyID="BE2">
        <structure:Code id="S1311">
          <common:Annotations>
            <common:Annotation><common:AnnotationTitle>x</common:AnnotationTitle></common:Annotation>
          </common:Annotations>
          <common:Name xml:lang="en">Central government</common:Name>
        </structure:Code>
        <structure:Code id="S1312">
          <common:Name xml:lang="en">State government</common:Name>
        </structure:Code>
      </structure:Codelist>
    </structure:Codelists>
  </message:Structures>
</message:Structure>
`;

describe("parseSdmxDataflow", () => {
  it("extracts id/agency/version/name and the linked DSD id", () => {
    const dataflow = parseSdmxDataflow(SAMPLE_XML);
    expect(dataflow).toEqual({
      id: "DF_NFGOV_DISS",
      agencyId: "BE2",
      version: "1.0",
      name: "Non-financial account of the government - overview",
      dataStructureId: "DS_NFGOV_DISS",
    });
  });
});

describe("parseSdmxDataStructure", () => {
  it("preserves dimension order from the DSD's position attribute, not document order", () => {
    const dsd = parseSdmxDataStructure(SAMPLE_XML);
    expect(dsd.dimensions.map((d) => d.id)).toEqual(["FREQ", "GOVTYPE", "ITEM"]);
    expect(dsd.dimensions.map((d) => d.codelistId)).toEqual(["CL_FREQ", "CL_NACC_GOVTYPE_DISS", "CL_NACC_ITEM_DISS"]);
    expect(dsd.timeDimensionId).toBe("TIME_PERIOD");
    expect(dsd.primaryMeasureId).toBe("OBS_VALUE");
  });
});

describe("parseSdmxCodelists", () => {
  it("extracts codelist items even when an Annotations block sits between the code tag and its name", () => {
    const codelists = parseSdmxCodelists(SAMPLE_XML);
    const govtype = codelists.get("CL_NACC_GOVTYPE_DISS");
    expect(govtype?.items).toEqual([
      { id: "S1311", name: "Central government" },
      { id: "S1312", name: "State government" },
    ]);
  });
});
