const PHONE = /(?:\+62|62|0)8[\d\s-]{7,14}\d/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;
const LABELLED_NAME =
  /\b(?:nama(?:\s+saya)?|namaku)\s*[:=-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi;

/**
 * Masks reporter-identifying data only. Victim counts and locations are core
 * report data and stay intact. Token map stays in memory on this device.
 */
export function maskReporterPII(text: string) {
  const tokens = new Map<string, string>();
  let n = 0;
  const token = (kind: string, value: string) => {
    const existing = [...tokens.entries()].find(([, v]) => v === value);
    if (existing) return existing[0];
    const key = `[${kind}_${++n}]`;
    tokens.set(key, value);
    return key;
  };

  const masked = text
    .replace(EMAIL, (value) => token("EMAIL", value))
    .replace(PHONE, (value) => token("TELEPON", value.trim()))
    .replace(LABELLED_NAME, (match, name: string) => match.replace(name, token("NAMA", name)));

  return { masked, tokens: Object.fromEntries(tokens) };
}
