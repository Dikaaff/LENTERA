import type { ClusterResult, ReportRecord, SitrepResult } from "@/modules/reports";

export interface SanitizedReport {
  id: string;
  region: string;
  createdAt: number;
  extraction: ReportRecord["extraction"];
}

/** Cloud input: validated extraction only. No raw note, no photo, no reporter id. */
export const sanitizedReports = (reports: ReportRecord[]): SanitizedReport[] =>
  reports
    .filter((report) => !report.needsReview && report.extraction.is_report)
    .map(({ id, region, createdAt, extraction }) => ({ id, region, createdAt, extraction }));

export const WORD_LIMIT = 250;

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const sitrepWords = (sitrep: SitrepResult) =>
  wordCount(sitrep.sections.flatMap((s) => s.claims.map((c) => c.text)).join(" "));

export const claimsWithSources = (sitrep: SitrepResult) =>
  sitrep.sections.flatMap((section) =>
    section.claims
      .filter((claim) => claim.source_ids.length > 0)
      .map((claim) => ({ ...claim, heading: section.heading })),
  );

/** Decisions below 0.6 are surfaced for review, never applied silently. */
export const splitClusters = (result: ClusterResult) => ({
  applied: result.clusters.filter((cluster) => cluster.confidence >= 0.6),
  review: result.clusters.filter((cluster) => cluster.confidence < 0.6),
});
