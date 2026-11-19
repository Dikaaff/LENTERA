export type Language = "id" | "en";

export const isLanguage = (value: unknown): value is Language => value === "id" || value === "en";

/** Dates and numbers follow the selected interface language, not the browser. */
export const localeFor = (language: Language) => (language === "id" ? "id-ID" : "en-GB");
