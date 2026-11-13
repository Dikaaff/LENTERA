# Firebase AI Logic — hybrid inference (Web)

Accessed: 2026-11-13.

## Verified facts

Source: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started

- Hybrid inference on web requires Firebase AI Logic JS SDK v12.5.0+ and Chrome
  Desktop 139+.
- Required Chrome flag: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
- Initialize: `getAI(firebaseApp, { backend: new GoogleAIBackend() })`.
- Create: `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE })`.
- `initializeDeviceModel(callback)` must run on/after a user gesture and before
  `generateContent`. Progress is a 0–1 value.
- On-device supports single-turn text generation, text + JPEG/PNG inline data,
  and structured output. No chat, tools, grounding, or countTokens.
- Documented on-device token ceiling on that page: 9216 tokens. The product
  brief uses a conservative 4,000-token routing ceiling.

Source: https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options

- Modes: `PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`,
  `ONLY_IN_CLOUD`.
- Which path ran is `result.response.inferenceSource`, value `ON_DEVICE` or
  `IN_CLOUD` (JS SDK v12.5.0+).
- Cloud fallback model is overridable with `inCloudParams.model`; default is
  `gemini-3.5-flash-lite` from JS SDK v13.0.0.
- Cloud params: `inCloudParams.generationConfig`.
- On-device params: `onDeviceParams.createOptions` (temperature, topK,
  expectedInputs, expectedOutputs, initialPrompts) and
  `onDeviceParams.promptOptions.responseConstraint`.
- App Check enforcement for AI Logic is required starting 2026-11-02.

Source: https://firebase.google.com/docs/ai-logic/hybrid/web/generate-structured-output

- Hybrid structured output config:
  - cloud: `responseMimeType: "application/json"` + `responseSchema`.
  - device: `responseConstraint` with the same schema.
- Schema can be built with `Schema.object` / `Schema.array` etc., or plain JSON.

## Design consequences used in this repo

- `src/modules/inference` is the only module importing `firebase/ai`.
- The model is created per task with both cloud and device params.
- Routing is declared policy, not guessed from `navigator.onLine`.
- Structured output is requested on both paths; Zod still validates the result.
- `inferenceSource` is recorded in every observability object.

## Unverified here

- No Firebase project or Nano-capable device was attached to this build
  session. No live inference call was executed. See
  `docs/state/checkpoint.md` for the open blocker.
