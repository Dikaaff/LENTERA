import { useSyncExternalStore } from "react";
import {
  heldCount,
  resolveRemote,
  type Extraction,
  type InferenceMeta,
  type ReportRecord,
  type ReportStatus,
} from "@/modules/reports";
import { allReports, patchReport, putReport, subscribeQueue } from "./store";
import { isFirebaseConfigured } from "@/lib/firebase";
import { pushReport, watchReport } from "./sync";

export const queueMode = isFirebaseConfigured ? "cloud" : "lokal";

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export interface SaveReportInput {
  rawNote: string;
  photo: string | null;
  post: string;
  region: string;
  reporterId: string;
  extraction: Extraction;
  inference: InferenceMeta;
  needsReview: boolean;
  status?: ReportStatus;
}

const watched = new Set<string>();

function sync(record: ReportRecord) {
  if (!isFirebaseConfigured) return;
  void pushReport(record).then((sent) => {
    if (!sent || watched.has(record.id)) return;
    watched.add(record.id);
    watchReport(record.id, (remoteUpdatedAt) => {
      const local = allReports().find((row) => row.id === record.id);
      if (!local) return;
      const next = resolveRemote(local, { updatedAt: remoteUpdatedAt });
      patchReport(local.id, { status: next });
    });
  });
}

export function saveReport(input: SaveReportInput): ReportRecord {
  const now = Date.now();
  const record: ReportRecord = {
    ...input,
    id: newId(),
    status: input.status ?? "queued",
    createdAt: now,
    updatedAt: now,
  };
  putReport(record);
  sync(record);
  return record;
}

export function updateReport(id: string, patch: Partial<ReportRecord>) {
  patchReport(id, patch);
}

export function retrySync() {
  allReports()
    .filter((row) => row.status === "queued")
    .forEach(sync);
}

export const useReports = () => useSyncExternalStore(subscribeQueue, allReports, allReports);

export function useHeldCount() {
  return heldCount(useReports());
}

export function exportQueue(): string {
  const payload = JSON.stringify(
    { app: "LENTERA", exportedAt: new Date().toISOString(), reports: allReports() },
    null,
    2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lentera-antrean-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  return link.download;
}
