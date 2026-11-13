# Evidence map — `firebase/ai` imported and called

The submission rule is "imported and called at runtime, not only named in the
README". This is the static mapping; runtime screenshots are pending a Firebase
project.

## Import

Only one file imports the library:

`src/modules/inference/client.ts`

```ts
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
```

`npm run boundaries` fails if any other module imports `firebase/ai`.

## Call sites

| API                                                               | Function      | When it runs                                                    |
| ----------------------------------------------------------------- | ------------- | --------------------------------------------------------------- |
| `getAI(app, { backend: new GoogleAIBackend() })`                  | `createModel` | every `runTask` call                                            |
| `getGenerativeModel(ai, { mode, inCloudParams, onDeviceParams })` | `createModel` | every `runTask` call                                            |
| `model.initializeDeviceModel(cb)`                                 | `generate`    | local or preferred-local modes, after the submit button gesture |
| `model.generateContent(parts)`                                    | `generate`    | every task: extraction, clustering, SITREP                      |
| `result.response.inferenceSource`                                 | `generate`    | every successful call; stored as `meta.inferenceSource`         |
| `result.response.text()`                                          | `generate`    | every successful call                                           |

## UI trigger paths

- `src/screens/CaptureScreen.tsx` → `runTask("report.extract.v1", ...)` on the
  **Proses laporan** button. This is the user gesture that satisfies Chrome's
  activation requirement.
- `src/screens/SitrepScreen.tsx` → `runTask("sitrep.cluster.v1")` and
  `runTask("sitrep.daily.v1")` behind explicit buttons and the consent gate.

## What is still needed for a submission-grade proof

1. Deployed or localhost build with `VITE_FIREBASE_*` filled.
2. DevTools Network screenshot of the local path showing no Firebase AI request.
3. Screenshot of the cloud path showing the request and
   `meta.inferenceSource === "IN_CLOUD"`.
4. Screenshot of the Chrome Nano download progress.
5. A one-line console trace from `generate` printing the model actually used.

No screenshot is committed because no such run was possible here.
