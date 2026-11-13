import { getFirebaseApp } from "@/lib/firebase";
import type { InferenceMeta } from "@/modules/reports";
import { generate } from "./client";
import { setLastRun } from "./status";
import {
  TASKS,
  pathFromSource,
  type Mode,
  type TaskInputs,
  type TaskName,
  type TaskOutputs,
} from "./tasks";
import { ON_DEVICE_CEILING, estimateTokens } from "./token";

export interface RunOptions {
  consentToCloud?: boolean;
  forceCloud?: boolean;
  onProgress?: (fraction: number) => void;
}

export interface InferenceResult<T> {
  status: "ok" | "unverified" | "unavailable";
  data: T | null;
  meta: InferenceMeta;
  rawText?: string;
  error?: string;
}

const parseJson = (text: string): unknown => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
};

const validate = <K extends TaskName>(task: K, text: string) => {
  try {
    const parsed = TASKS[task].schema.parse(parseJson(text));
    return { ok: true as const, data: parsed as TaskOutputs[K] };
  } catch {
    return { ok: false as const };
  }
};

const meta = (
  taskName: TaskName,
  mode: Mode,
  reason: string,
  started: number,
  source: "ON_DEVICE" | "IN_CLOUD" | undefined,
  retried: boolean,
): InferenceMeta => ({
  path: pathFromSource(mode, source),
  durationMs: Math.round(performance.now() - started),
  artifact: taskName,
  version: "1.0.0",
  reason,
  inferenceSource: source,
  retried,
});

const unavailable = (
  reason: string,
  started: number,
  taskName: TaskName,
): InferenceResult<never> => {
  const value: InferenceMeta = {
    path: "unavailable",
    durationMs: Math.round(performance.now() - started),
    artifact: taskName,
    version: "1.0.0",
    reason,
    retried: false,
  };
  setLastRun(value);
  return { status: "unavailable", data: null, meta: value, error: reason };
};

/**
 * The only inference entry point. Policy decides the path; network status never does.
 */
export async function runTask<K extends TaskName>(
  taskName: K,
  input: TaskInputs[K],
  options: RunOptions = {},
): Promise<InferenceResult<TaskOutputs[K]>> {
  const started = performance.now();
  const task = TASKS[taskName];
  const prompt = task.build(input);
  const photo =
    taskName === "report.extract.v1"
      ? ((input as TaskInputs["report.extract.v1"]).photoDataUrl ?? null)
      : null;
  const tokens = estimateTokens(prompt) + (photo ? 900 : 0);

  let mode = task.mode;
  let reason = task.reason;
  if (taskName === "report.extract.v1" && tokens > ON_DEVICE_CEILING) {
    mode = "ONLY_IN_CLOUD";
    reason = `Input ${tokens} token melewati batas ${ON_DEVICE_CEILING}; langsung ke cloud.`;
  }
  if (options.forceCloud) {
    mode = "ONLY_IN_CLOUD";
    reason = "Pengguna memilih pemrosesan cloud.";
  }
  if (!options.consentToCloud && mode === "PREFER_ON_DEVICE") {
    mode = "ONLY_ON_DEVICE";
    reason += " Lokal saja sampai persetujuan cloud diberikan.";
  }

  const cloudOnly = mode === "ONLY_IN_CLOUD" || mode === "PREFER_IN_CLOUD";
  if (cloudOnly && !options.consentToCloud) {
    return unavailable("Persetujuan cloud belum diberikan.", started, taskName);
  }
  if (!getFirebaseApp()) {
    return unavailable(
      "Firebase belum dikonfigurasi. Isi VITE_FIREBASE_* untuk mengaktifkan AI.",
      started,
      taskName,
    );
  }

  try {
    const first = await generate({
      mode,
      prompt,
      schema: task.jsonSchema,
      temperature: task.temperature,
      photoDataUrl: photo,
      onProgress: options.onProgress,
    });
    const checked = validate(taskName, first.text);
    if (checked.ok) {
      const value = meta(taskName, mode, reason, started, first.inferenceSource, false);
      setLastRun(value);
      return { status: "ok", data: checked.data, meta: value };
    }

    const canRetryInCloud = first.model === "on_device" && options.consentToCloud !== false;
    if (canRetryInCloud) {
      const retry = await generate({
        mode: "ONLY_IN_CLOUD",
        prompt,
        schema: task.jsonSchema,
        temperature: task.temperature,
        photoDataUrl: photo,
      });
      const second = validate(taskName, retry.text);
      if (second.ok) {
        const value = meta(
          taskName,
          "ONLY_IN_CLOUD",
          "Validasi lokal gagal; satu percobaan ulang di cloud.",
          started,
          retry.inferenceSource,
          true,
        );
        setLastRun(value);
        return { status: "ok", data: second.data, meta: value };
      }
      const value = meta(
        taskName,
        "ONLY_IN_CLOUD",
        "Validasi lokal dan cloud gagal; hasil disimpan untuk ditinjau.",
        started,
        retry.inferenceSource,
        true,
      );
      setLastRun(value);
      return { status: "unverified", data: null, meta: value, rawText: retry.text };
    }

    const value = meta(
      taskName,
      mode,
      "Validasi gagal dan cloud tidak diizinkan; hasil disimpan untuk ditinjau.",
      started,
      first.inferenceSource,
      false,
    );
    setLastRun(value);
    return { status: "unverified", data: null, meta: value, rawText: first.text };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Model tidak tersedia.";
    return unavailable(detail, started, taskName);
  }
}
