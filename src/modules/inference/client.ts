import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  type GenerativeModel,
} from "firebase/ai";
import { getFirebaseApp } from "@/lib/firebase";
import type { Mode } from "./tasks";

const MODES: Record<Mode, InferenceMode> = {
  PREFER_ON_DEVICE: InferenceMode.PREFER_ON_DEVICE,
  ONLY_ON_DEVICE: InferenceMode.ONLY_ON_DEVICE,
  PREFER_IN_CLOUD: InferenceMode.PREFER_IN_CLOUD,
  ONLY_IN_CLOUD: InferenceMode.ONLY_IN_CLOUD,
};

interface GenerateOptions {
  mode: Mode;
  prompt: string;
  schema: { [key: string]: unknown };
  temperature: number;
  photoDataUrl?: string | null;
  onProgress?: (fraction: number) => void;
}

export type InferenceSource = "ON_DEVICE" | "IN_CLOUD";

export interface GenerateResult {
  text: string;
  inferenceSource?: InferenceSource;
  model: "on_device" | "cloud";
}

/**
 * Firebase AI Logic reports the source in lower case ("in_cloud"). Normalising it
 * here keeps the persisted record valid for the Zod schema and for path labels.
 */
export const normalizeSource = (value: unknown): InferenceSource | undefined => {
  if (typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  return upper === "ON_DEVICE" || upper === "IN_CLOUD" ? upper : undefined;
};

const imagePart = (dataUrl: string) => {
  const [header, data] = dataUrl.split(",");
  const mimeType = header.includes("png") ? "image/png" : "image/jpeg";
  return { type: "inlineData" as const, inlineData: { data, mimeType } };
};

function createModel(
  mode: Mode,
  schema: { [key: string]: unknown },
  temperature: number,
): GenerativeModel {
  const app = getFirebaseApp();
  if (!app) throw new Error("Firebase belum dikonfigurasi.");
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  return getGenerativeModel(ai, {
    mode: MODES[mode],
    inCloudParams: {
      // Firebase's documented default fallback as of SDK v13.
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature,
      },
    },
    onDeviceParams: {
      createOptions: {
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      },
      promptOptions: { responseConstraint: schema },
    },
  });
}

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const model = createModel(options.mode, options.schema, options.temperature);
  if (options.mode !== "ONLY_IN_CLOUD" && options.mode !== "PREFER_IN_CLOUD") {
    try {
      await model.initializeDeviceModel((value) => options.onProgress?.(value));
    } catch {
      // PREFER modes may continue to the cloud; ONLY_ON_DEVICE will throw below.
    }
  }
  const parts = options.photoDataUrl
    ? [options.prompt, imagePart(options.photoDataUrl)]
    : options.prompt;
  const result = await model.generateContent(parts);
  const source = normalizeSource(result.response.inferenceSource);
  return {
    text: result.response.text(),
    inferenceSource: source,
    model: source === "ON_DEVICE" ? "on_device" : "cloud",
  };
}
