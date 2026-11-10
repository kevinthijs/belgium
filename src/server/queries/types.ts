export type DataStatusDisplay =
  | "BEGROTING"
  | "AANGEPASTE_BEGROTING"
  | "VOORLOPIG"
  | "DEFINITIEF"
  | "RAMING"
  | "PROGNOSE";

export interface SourceReference {
  organisation: string;
  dataset: string;
  datasetUrl?: string;
  period: string;
  publishedAt: string | null;
  status: DataStatusDisplay;
  framework?: string;
  isDemoData?: boolean;
}

export interface MetricDisplay {
  value: string;
  rawValue: string;
  unit: string;
  period: string;
  status: DataStatusDisplay;
  source: SourceReference;
}

export type UnavailableMetric = { available: false; reason: string };
export type AvailableMetric = MetricDisplay & { available: true };
export type MetricResult = AvailableMetric | UnavailableMetric;
