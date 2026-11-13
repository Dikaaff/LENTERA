import type { ReportRecord, ReportStatus } from "./types";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  draft: "draf",
  queued: "menunggu",
  synced: "terkirim",
  conflict: "konflik",
};

export const statusLabel = (report: Pick<ReportRecord, "status" | "needsReview">) =>
  report.needsReview && report.status !== "synced" ? "perlu ditinjau" : STATUS_LABEL[report.status];

export const heldCount = (reports: Pick<ReportRecord, "status">[]) =>
  reports.filter((r) => r.status === "queued" || r.status === "draft" || r.status === "conflict")
    .length;

/** Last-write-wins is prevented: a newer remote copy flags a human decision. */
export const resolveRemote = (local: ReportRecord, remote: Pick<ReportRecord, "updatedAt">) =>
  remote.updatedAt > local.updatedAt && local.status !== "synced" ? "conflict" : local.status;
