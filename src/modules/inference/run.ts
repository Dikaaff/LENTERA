import { getFirebaseApp } from "@/lib/firebase";
import type { Language } from "@/lib/language";
import type { InferenceMeta } from "@/modules/reports";
import { generate } from "./client";
import { messagesFor } from "./messages";
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
  language?: Language;
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
  const language = options.language ?? "id";
  const msg = messagesFor(language);
  const task = TASKS[taskName];
  const prompt = task.build(input, language);
  const photo =
    taskName === "report.extract.v1"
      ? ((input as TaskInputs["report.extract.v1"]).photoDataUrl ?? null)
      : null;
  const tokens = estimateTokens(prompt) + (photo ? 900 : 0);

  let mode = task.mode;
  let reason = task.reason[language];
  if (taskName === "report.extract.v1" && tokens > ON_DEVICE_CEILING) {
    mode = "ONLY_IN_CLOUD";
    reason = msg.overBudget(tokens, ON_DEVICE_CEILING);
  }
  if (options.forceCloud) {
    mode = "ONLY_IN_CLOUD";
    reason = msg.forcedCloud;
  }
  if (!options.consentToCloud && mode === "PREFER_ON_DEVICE") {
    mode = "ONLY_ON_DEVICE";
    reason += msg.localOnlySuffix;
  }

  if (import.meta.env.VITE_DISABLE_AI === "1") {
    return unavailable(msg.aiDisabled, started, taskName);
  }

  const cloudOnly = mode === "ONLY_IN_CLOUD" || mode === "PREFER_IN_CLOUD";
  if (cloudOnly && !options.consentToCloud) {
    return unavailable(msg.consentMissing, started, taskName);
  }
  if (!getFirebaseApp()) {
    return unavailable(msg.firebaseMissing, started, taskName);
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
          msg.localRetry,
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
        msg.bothFailed,
        started,
        retry.inferenceSource,
        true,
      );
      setLastRun(value);
      return { status: "unverified", data: null, meta: value, rawText: retry.text };
    }

    const value = meta(taskName, mode, msg.localOnlyFailed, started, first.inferenceSource, false);
    setLastRun(value);
    return { status: "unverified", data: null, meta: value, rawText: first.text };
  } catch (error) {
    const detail = error instanceof Error ? error.message : msg.modelUnavailable;
    return unavailable(detail, started, taskName);
  }
}
