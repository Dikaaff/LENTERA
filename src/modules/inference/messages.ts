import type { Language } from "@/lib/language";

export interface InferenceMessages {
  overBudget: (tokens: number, ceiling: number) => string;
  forcedCloud: string;
  localOnlySuffix: string;
  aiDisabled: string;
  consentMissing: string;
  firebaseMissing: string;
  localRetry: string;
  bothFailed: string;
  localOnlyFailed: string;
  modelUnavailable: string;
}

const id: InferenceMessages = {
  overBudget: (tokens, ceiling) =>
    `Input ${tokens} token melewati batas ${ceiling}; langsung ke cloud.`,
  forcedCloud: "Pengguna memilih pemrosesan cloud.",
  localOnlySuffix: " Lokal saja sampai persetujuan cloud diberikan.",
  aiDisabled: "AI dinonaktifkan untuk uji lokal. Isi kolom manual; catatan tetap tersimpan.",
  consentMissing: "Persetujuan cloud belum diberikan.",
  firebaseMissing: "Firebase belum dikonfigurasi. Isi VITE_FIREBASE_* untuk mengaktifkan AI.",
  localRetry: "Validasi lokal gagal; satu percobaan ulang di cloud.",
  bothFailed: "Validasi lokal dan cloud gagal; hasil disimpan untuk ditinjau.",
  localOnlyFailed: "Validasi gagal dan cloud tidak diizinkan; hasil disimpan untuk ditinjau.",
  modelUnavailable: "Model tidak tersedia.",
};

const en: InferenceMessages = {
  overBudget: (tokens, ceiling) =>
    `Input of ${tokens} tokens exceeds the ${ceiling} limit; going straight to the cloud.`,
  forcedCloud: "The user chose cloud processing.",
  localOnlySuffix: " On-device only until cloud consent is granted.",
  aiDisabled: "AI is disabled for local testing. Fill the fields manually; the note is kept.",
  consentMissing: "Cloud consent has not been granted.",
  firebaseMissing: "Firebase is not configured. Set VITE_FIREBASE_* to enable AI.",
  localRetry: "Local validation failed; retrying once in the cloud.",
  bothFailed: "Local and cloud validation failed; the result is kept for review.",
  localOnlyFailed: "Validation failed and cloud is not allowed; the result is kept for review.",
  modelUnavailable: "The model is unavailable.",
};

export const messagesFor = (language: Language): InferenceMessages => (language === "en" ? en : id);
