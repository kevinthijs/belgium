import type { DataStatusDisplay } from "./types";

const STATUS_LABEL: Record<string, DataStatusDisplay> = {
  BUDGET: "BEGROTING",
  ADJUSTED_BUDGET: "AANGEPASTE_BEGROTING",
  PROVISIONAL: "VOORLOPIG",
  FINAL: "DEFINITIEF",
  ESTIMATE: "RAMING",
  FORECAST: "PROGNOSE",
};

export function toDisplayStatus(status: string): DataStatusDisplay {
  return STATUS_LABEL[status] ?? "VOORLOPIG";
}

export const STATUS_LABEL_TEXT: Record<DataStatusDisplay, string> = {
  BEGROTING: "Begroting",
  AANGEPASTE_BEGROTING: "Aangepaste begroting",
  VOORLOPIG: "Voorlopig",
  DEFINITIEF: "Definitief",
  RAMING: "Raming",
  PROGNOSE: "Prognose",
};
