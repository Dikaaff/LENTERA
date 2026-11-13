import { reportRecordSchema, type ReportRecord } from "@/modules/reports";

const KEY = "lentera.queue.v1";
const listeners = new Set<() => void>();
let cache: ReportRecord[] | null = null;

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

function load(): ReportRecord[] {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((value) => {
        const checked = reportRecordSchema.safeParse(value);
        return checked.success ? [checked.data] : [];
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function allReports(): ReportRecord[] {
  cache ??= load();
  return cache;
}

function persist(reports: ReportRecord[]) {
  cache = [...reports].sort((a, b) => b.createdAt - a.createdAt);
  try {
    storage()?.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: the in-memory queue still serves this session.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeQueue(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const putReport = (report: ReportRecord) =>
  persist([report, ...allReports().filter((row) => row.id !== report.id)]);

export function patchReport(id: string, patch: Partial<ReportRecord>) {
  persist(
    allReports().map((row) => (row.id === id ? { ...row, ...patch, updatedAt: Date.now() } : row)),
  );
}

export const replaceReports = persist;
