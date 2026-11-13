const KEY = "lentera.device.v1";

export function deviceId(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `device-${Date.now()}`;
    window.localStorage.setItem(KEY, created);
    return created;
  } catch {
    return "device-tanpa-penyimpanan";
  }
}
