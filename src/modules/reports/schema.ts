import { z } from "zod";
import { CATEGORIES, CONFIDENCES, REPORT_STATUSES, URGENCIES } from "./types";

const nullableText = z.string().min(1).max(600).nullable();

// One field report is local by scope. Larger claims need a human, not silent acceptance.
export const MAX_PEOPLE_PER_REPORT = 100_000;
export const MAX_NEED_QUANTITY = 100_000;

export const locationSchema = z
  .strictObject({
    name: nullableText,
    regency: nullableText,
    confidence: z.enum(CONFIDENCES),
  })
  .transform((value) =>
    value.name && !value.regency && value.confidence !== "low"
      ? { ...value, confidence: "low" as const }
      : value,
  );

export const needSchema = z.strictObject({
  item: z.string().min(1).max(120),
  quantity: z.number().nonnegative().max(MAX_NEED_QUANTITY).nullable(),
  unit: z.string().max(40).nullable(),
});

export const extractionSchema = z.strictObject({
  is_report: z.boolean(),
  summary: nullableText.optional().default(null),
  category: z.enum(CATEGORIES).nullable().optional().default(null),
  urgency: z.enum(URGENCIES).nullable().optional().default(null),
  location: locationSchema.nullable().optional().default(null),
  people_affected: z
    .strictObject({
      min: z.number().int().nonnegative().max(MAX_PEOPLE_PER_REPORT).nullable(),
      max: z.number().int().nonnegative().max(MAX_PEOPLE_PER_REPORT).nullable(),
    })
    .nullable()
    .optional()
    .default(null),
  needs: z.array(needSchema).max(20).optional().default([]),
  note_anomaly: nullableText.optional().default(null),
});

export const inferenceMetaSchema = z.strictObject({
  path: z.enum(["on_device", "cloud", "fallback", "unavailable"]),
  durationMs: z.number().nonnegative(),
  artifact: z.string(),
  version: z.string(),
  reason: z.string(),
  inferenceSource: z.enum(["ON_DEVICE", "IN_CLOUD"]).optional(),
  retried: z.boolean(),
});

export const reportRecordSchema = z.strictObject({
  id: z.string().min(8).max(64),
  createdAt: z.number(),
  updatedAt: z.number(),
  status: z.enum(REPORT_STATUSES),
  needsReview: z.boolean(),
  post: z.string().min(1).max(80),
  region: z.string().min(1).max(80),
  reporterId: z.string().min(1),
  rawNote: z.string().max(20000),
  photo: z.string().nullable(),
  extraction: extractionSchema,
  inference: inferenceMetaSchema,
});

export const clusterSchema = z.strictObject({
  clusters: z.array(
    z.strictObject({
      canonical_id: z.string(),
      duplicate_ids: z.array(z.string()),
      confidence: z.number().min(0).max(1),
      reason: z.string().max(300),
    }),
  ),
  unresolved_ids: z.array(z.string()).optional().default([]),
});

export const sitrepSchema = z.strictObject({
  sections: z.array(
    z.strictObject({
      heading: z.enum(["overview", "most_urgent", "affected", "gaps"]),
      claims: z.array(
        z.strictObject({
          text: z.string().min(1).max(400),
          source_ids: z.array(z.string()),
        }),
      ),
    }),
  ),
});

export type ClusterResult = z.infer<typeof clusterSchema>;
export type SitrepResult = z.infer<typeof sitrepSchema>;

/** Plain JSON Schema handed to both inference paths. Keep optionalProperties explicit. */
export const extractionJsonSchema = {
  type: "object",
  properties: {
    is_report: { type: "boolean" },
    summary: { type: ["string", "null"] },
    category: { type: ["string", "null"], enum: [...CATEGORIES, null] },
    urgency: { type: ["string", "null"], enum: [...URGENCIES, null] },
    location: {
      type: ["object", "null"],
      properties: {
        name: { type: ["string", "null"] },
        regency: { type: ["string", "null"] },
        confidence: { type: "string", enum: [...CONFIDENCES] },
      },
      required: ["name", "regency", "confidence"],
    },
    people_affected: {
      type: ["object", "null"],
      properties: {
        min: { type: ["integer", "null"], maximum: MAX_PEOPLE_PER_REPORT },
        max: { type: ["integer", "null"], maximum: MAX_PEOPLE_PER_REPORT },
      },
      required: ["min", "max"],
    },
    needs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          quantity: { type: ["number", "null"], maximum: MAX_NEED_QUANTITY },
          unit: { type: ["string", "null"] },
        },
        required: ["item", "quantity", "unit"],
      },
    },
    note_anomaly: { type: ["string", "null"] },
  },
  required: [
    "is_report",
    "summary",
    "category",
    "urgency",
    "location",
    "people_affected",
    "needs",
    "note_anomaly",
  ],
} as const;
