import type { Language } from "@/lib/language";
import type { ReportRecord, ReportStatus } from "./types";

const STATUS_LABEL: Record<Language, Record<ReportStatus, string>> = {
  id: { draft: "draf", queued: "menunggu", synced: "terkirim", conflict: "konflik" },
  en: { draft: "draft", queued: "queued", synced: "sent", conflict: "conflict" },
};

export const statusLabel = (
  report: Pick<ReportRecord, "status" | "needsReview">,
  language: Language = "id",
) =>
  report.needsReview && report.status !== "synced"
    ? language === "id"
      ? "perlu ditinjau"
      : "needs review"
    : STATUS_LABEL[language][report.status];

export const heldCount = (reports: Pick<ReportRecord, "status">[]) =>
  reports.filter((r) => r.status === "queued" || r.status === "draft" || r.status === "conflict")
    .length;

/** Last-write-wins is prevented: a newer remote copy flags a human decision. */
export const resolveRemote = (
  local: ReportRecord,
  remote: Pick<ReportRecord, "updatedAt">,
): ReportStatus => {
  if (remote.updatedAt > local.updatedAt && local.status !== "synced") return "conflict";
  if (remote.updatedAt < local.updatedAt) return local.status;
  return "synced";
};
