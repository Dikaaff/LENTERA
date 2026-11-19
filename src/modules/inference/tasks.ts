import type { Language } from "@/lib/language";
import {
  clusterSchema,
  extractionJsonSchema,
  extractionSchema,
  sitrepSchema,
} from "@/modules/reports";
import { cluster, daily, extract } from "./prompts";
import type { InferencePath } from "@/modules/reports";

export type Mode = "PREFER_ON_DEVICE" | "ONLY_ON_DEVICE" | "PREFER_IN_CLOUD" | "ONLY_IN_CLOUD";
export type TaskName = "report.extract.v1" | "sitrep.cluster.v1" | "sitrep.daily.v1";

export interface TaskInputs {
  "report.extract.v1": { note: string; photoDataUrl?: string | null };
  "sitrep.cluster.v1": { reports: unknown };
  "sitrep.daily.v1": { reports: unknown; aggregates: unknown };
}

export interface TaskOutputs {
  "report.extract.v1": import("@/modules/reports").Extraction;
  "sitrep.cluster.v1": import("@/modules/reports").ClusterResult;
  "sitrep.daily.v1": import("@/modules/reports").SitrepResult;
}

interface TaskDef {
  mode: Mode;
  reason: Record<Language, string>;
  temperature: number;
  schema: {
    parse: (value: unknown) => unknown;
    safeParse: (value: unknown) => { success: boolean };
  };
  jsonSchema: { [key: string]: unknown };
  build: (input: unknown, language: Language) => string;
}

const clusterJsonSchema = {
  type: "object",
  properties: {
    clusters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          canonical_id: { type: "string" },
          duplicate_ids: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          reason: { type: "string" },
        },
        required: ["canonical_id", "duplicate_ids", "confidence", "reason"],
      },
    },
    unresolved_ids: { type: "array", items: { type: "string" } },
  },
  required: ["clusters"],
} as const;

const sitrepJsonSchema = {
  type: "object",
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string", enum: ["overview", "most_urgent", "affected", "gaps"] },
          claims: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                source_ids: { type: "array", items: { type: "string" } },
              },
              required: ["text", "source_ids"],
            },
          },
        },
        required: ["heading", "claims"],
      },
    },
  },
  required: ["sections"],
} as const;

export const TASKS: Record<TaskName, TaskDef> = {
  "report.extract.v1": {
    mode: "PREFER_ON_DEVICE",
    reason: {
      id: "Ekstraksi rutin dan privat harus tetap jalan tanpa jaringan.",
      en: "Routine, private extraction must keep working without a network.",
    },
    temperature: 0,
    schema: extractionSchema,
    jsonSchema: extractionJsonSchema,
    build: (input, language) =>
      extract.buildUserPrompt((input as TaskInputs["report.extract.v1"]).note, language),
  },
  "sitrep.cluster.v1": {
    mode: "PREFER_IN_CLOUD",
    reason: {
      id: "Deduplikasi butuh konteks lintas laporan.",
      en: "Deduplication needs context across reports.",
    },
    temperature: 0,
    schema: clusterSchema,
    jsonSchema: clusterJsonSchema,
    build: (input, language) =>
      cluster.buildUserPrompt((input as TaskInputs["sitrep.cluster.v1"]).reports, language),
  },
  "sitrep.daily.v1": {
    mode: "ONLY_IN_CLOUD",
    reason: {
      id: "Narasi panjang dengan banyak sumber tidak muat di perangkat.",
      en: "A long narrative with many sources does not fit on the device.",
    },
    temperature: 0.3,
    schema: sitrepSchema,
    jsonSchema: sitrepJsonSchema,
    build: (input, language) => {
      const value = input as TaskInputs["sitrep.daily.v1"];
      return daily.buildUserPrompt(value.reports, value.aggregates, language);
    },
  },
};

export const pathFromSource = (
  requested: Mode,
  source?: "ON_DEVICE" | "IN_CLOUD",
): InferencePath => {
  if (!source) return requested === "ONLY_IN_CLOUD" ? "cloud" : "fallback";
  if (source === "ON_DEVICE") return "on_device";
  return requested === "PREFER_ON_DEVICE" || requested === "ONLY_ON_DEVICE" ? "fallback" : "cloud";
};
