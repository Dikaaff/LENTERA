import { useSyncExternalStore } from "react";

const KEY = "lentera.consent.cloud.v1";
const listeners = new Set<() => void>();
let cached: boolean | null = null;

const read = () => {
  try {
    return window.localStorage.getItem(KEY) === "yes";
  } catch {
    return false;
  }
};

export const hasConsent = () => {
  cached ??= read();
  return cached;
};

export function setConsent(value: boolean) {
  cached = value;
  try {
    window.localStorage.setItem(KEY, value ? "yes" : "no");
  } catch {
    // A blocked storage keeps this session's choice only.
  }
  listeners.forEach((listener) => listener());
}

export const useConsent = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hasConsent,
    () => false,
  );
