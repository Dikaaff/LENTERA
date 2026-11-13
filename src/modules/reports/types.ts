export const URGENCIES = ["critical", "high", "medium", "low"] as const;
export const CATEGORIES = [
  "evacuation",
  "medical",
  "food_water",
  "shelter",
  "infrastructure",
  "logistics",
  "missing_person",
  "other",
] as const;
export const CONFIDENCES = ["high", "medium", "low"] as const;
export const REPORT_STATUSES = ["draft", "queued", "synced", "conflict"] as const;

export type Urgency = (typeof URGENCIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Confidence = (typeof CONFIDENCES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type InferencePath = "on_device" | "cloud" | "fallback" | "unavailable";

export interface Need {
  item: string;
  quantity: number | null;
  unit: string | null;
}

export interface Extraction {
  is_report: boolean;
  summary: string | null;
  category: Category | null;
  urgency: Urgency | null;
  location: {
    name: string | null;
    regency: string | null;
    confidence: Confidence;
  } | null;
  people_affected: { min: number | null; max: number | null } | null;
  needs: Need[];
  note_anomaly: string | null;
}

export interface InferenceMeta {
  path: InferencePath;
  durationMs: number;
  artifact: string;
  version: string;
  reason: string;
  inferenceSource?: "ON_DEVICE" | "IN_CLOUD";
  retried: boolean;
}

export interface ReportRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: ReportStatus;
  needsReview: boolean;
  post: string;
  region: string;
  reporterId: string;
  /** Local only. Never written to Firestore. */
  rawNote: string;
  /** Local only data URL. Never written to Firestore. */
  photo: string | null;
  extraction: Extraction;
  inference: InferenceMeta;
}

export const EMPTY_EXTRACTION: Extraction = {
  is_report: true,
  summary: null,
  category: null,
  urgency: null,
  location: null,
  people_affected: null,
  needs: [],
  note_anomaly: null,
};
