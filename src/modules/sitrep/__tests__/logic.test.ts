import { describe, expect, it } from "vitest";
import { extractionSchema } from "@/modules/reports/schema";
import type { ReportRecord } from "@/modules/reports/types";
import {
  claimsWithSources,
  sanitizedReports,
  sitrepWords,
  splitClusters,
  wordCount,
} from "../logic";

const extraction = extractionSchema.parse({
  is_report: true,
  summary: "Butuh air.",
  category: "food_water",
  urgency: "high",
  location: { name: "Cibeureum", regency: null, confidence: "low" },
  people_affected: { min: 10, max: 10 },
  needs: [{ item: "air", quantity: 20, unit: "liter" }],
  note_anomaly: null,
});

const report = (id: string, needsReview = false): ReportRecord => ({
  id,
  createdAt: 1,
  updatedAt: 1,
  status: "queued",
  needsReview,
  post: "Pos",
  region: "Jawa Barat",
  reporterId: "vol-1",
  rawNote: "Nama saya Budi, 0812-3456-7890",
  photo: null,
  extraction,
  inference: {
    path: "on_device",
    durationMs: 10,
    artifact: "report.extract.v1",
    version: "1.0.0",
    reason: "uji",
    retried: false,
  },
});

describe("SITREP logic", () => {
  it("counts words and detects an over-limit narrative", () => {
    expect(wordCount("satu dua tiga")).toBe(3);
    expect(
      sitrepWords({
        sections: [{ heading: "gaps", claims: [{ text: "a b c d", source_ids: ["x"] }] }],
      }),
    ).toBe(4);
  });

  it("drops claims without a source", () => {
    const result = claimsWithSources({
      sections: [
        {
          heading: "overview",
          claims: [
            { text: "bersumber", source_ids: ["r1"] },
            { text: "tanpa sumber", source_ids: [] },
          ],
        },
      ],
    });
    expect(result).toHaveLength(1);
  });

  it("separates low-confidence cluster decisions for review", () => {
    const split = splitClusters({
      clusters: [
        { canonical_id: "a", duplicate_ids: ["b"], confidence: 0.9, reason: "sama" },
        { canonical_id: "c", duplicate_ids: ["d"], confidence: 0.4, reason: "ragu" },
      ],
      unresolved_ids: [],
    });
    expect(split.applied).toHaveLength(1);
    expect(split.review).toHaveLength(1);
  });

  it("sends only validated extraction to cloud, never raw notes", () => {
    const [sanitized] = sanitizedReports([report("aaaaaaaa")]);
    expect(sanitized).not.toHaveProperty("rawNote");
    expect(sanitized).not.toHaveProperty("photo");
    expect(sanitized).not.toHaveProperty("reporterId");
    expect(sanitizedReports([report("bbbbbbbb", true)])).toHaveLength(0);
  });
});
