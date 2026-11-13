import { useSyncExternalStore } from "react";
import type { InferenceMeta } from "@/modules/reports";

let last: InferenceMeta | null = null;
const listeners = new Set<() => void>();

export function setLastRun(meta: InferenceMeta) {
  last = meta;
  listeners.forEach((listener) => listener());
}

export const useLastRun = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => last,
    () => last,
  );
