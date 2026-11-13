# Prompt metrics

Evaluation date: 2026-11-13.

No Firebase project, API key, or Nano-capable Chrome was available to this
session. The table below records only what the local suite actually measures.
Accuracy and latency are deliberately blank, not guessed.

| Artifact            | Path  | Schema valid (fixtures) | Avg input tokens        | Avg output tokens | Avg latency  | Failure modes observed        |
| ------------------- | ----- | ----------------------- | ----------------------- | ----------------- | ------------ | ----------------------------- |
| `report.extract.v1` | local | not executed            | ~2,100 est.             | unknown           | not measured | none observed (no live model) |
| `report.extract.v1` | cloud | not executed            | ~2,100 est.             | unknown           | not measured | none observed (no live model) |
| `sitrep.cluster.v1` | cloud | not executed            | depends on report count | unknown           | not measured | none observed                 |
| `sitrep.daily.v1`   | cloud | not executed            | depends on cluster size | unknown           | not measured | none observed                 |

## Automated checks that did run

- 43 unit tests pass, including:
  - injection defense string present verbatim;
  - all four adversarial notes stay under the 2,600-token budget;
  - schema rejects unknown keys and enum values;
  - low-confidence cluster decisions are separated for human review;
  - cloud payload excludes `rawNote`, `photo`, and `reporterId`.
- Token estimate method: `ceil(characters / 4)`, documented in
  `src/modules/inference/token.ts`. This is an estimate, not a model tokenizer.

## Procedure to produce the real numbers

1. Fill `VITE_FIREBASE_*` and enable AI Logic + App Check.
2. Build the 12-case suite in `report.extract.v1.TEST_CASES` as fixtures with
   expected JSON.
3. Run each case three times on cloud and record exact-match field accuracy,
   schema validity, latency, and output tokens.
4. Repeat on Chrome 139+ with Nano. Record `inferenceSource` for every call.
5. A/B table goes verbatim into the README. Below 90% extraction accuracy means
   the artifact is not wired into the UI.

## Known limitation

The Firebase SDK installed here (v13) accepts `temperature` only in
`inCloudParams.generationConfig`; the on-device create options do not expose a
temperature field. Determinism on the local path therefore relies on the prompt
and validation, not a sampler setting.
