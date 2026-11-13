# Prompt metrics

Measured: 2026-11-13, project `lentera-6f2a-db3a1`, model
`gemini-3.5-flash-lite` via Firebase AI Logic. Raw results:
`docs/prompts/cloud-metrics.json`.

| Artifact            | Path  | Runs | Schema valid | Field accuracy | Avg latency | P95 latency | Failure modes              |
| ------------------- | ----- | ---- | ------------ | -------------- | ----------- | ----------- | -------------------------- |
| `report.extract.v1` | cloud | 36   | 100%         | 87.5% (21/24)  | 2,603 ms    | 6,033 ms    | low-confidence rule missed |
| `report.extract.v1` | local | —    | not executed | —              | —           | —           | no Nano-capable Chrome     |
| `sitrep.cluster.v1` | cloud | —    | not executed | —              | —           | —           | not measured               |
| `sitrep.daily.v1`   | cloud | —    | not executed | —              | —           | —           | not measured               |

All 36 extraction calls returned `inferenceSource: "in_cloud"`. Token counts are
not exposed by the SDK; the only token figure is the local estimate
(`ceil(characters / 4)`, about 2,100 input tokens for the prompt suite).

## How this was measured

`scripts/measure-cloud.mjs` drives the real `runTask("report.extract.v1", ...,
{ consentToCloud: true, forceCloud: true })` inside Chromium against
`http://localhost:5173` with the real `.env.local`. It runs all 12 fixtures 3
times. The free tier allows 15 requests/minute, so the rerun used
`MEASURE_PACE_MS=5000`; an earlier unpaced attempt produced HTTP 429 for 19 of
36 calls and is not used as a quality result.

```bash
MEASURE_CONFIRM=1 MEASURE_PACE_MS=5000 npm run measure:cloud
```

The harness now reports availability (`ok / total`) separately from schema
validity (`valid / responded`). `runTask` validates every response with Zod, so
all 36 responses were schema-valid; there were no schema failures to repair.

## What missed

- `missing-regency` (3/3 runs): the model returned `confidence: "high"` for
  `Desa Cibeureum` with no regency; the prompt requires `"low"`. The field is
  not enforced in Zod, only instructed. This is the entire field-accuracy gap.
- `extreme-numbers` (3/3 runs): `"1.200.000 jiwa terdampak, butuh 999999 liter
air"` was accepted as a report (`is_report: true`) although the fixture expects
  rejection. There is no numeric upper bound in the schema. The UI still allows
  human correction.
- `fake-instruction`, `empty`, and `photo-only` were all correctly rejected
  (3/3 each). `fake-instruction` was recorded in `note_anomaly`, not followed.
- 36/36 calls completed with zero 429s and zero schema errors under pacing.

## Local verification that did run (not model quality)

- Firestore Auth + emulator walkthrough with `VITE_DISABLE_AI=1`:
  capture → consent → manual fallback → save → Firestore write → `terkirim` →
  reload persistence → map. Screenshots in `docs/evidence/`.
- 11 emulator rules tests pass.
- This proves the queue, sync, and rules halves. It does **not** measure a
  model, because `VITE_DISABLE_AI=1` short-circuits `runTask` before any AI call.

## Automated checks that did run

- 44 unit tests pass, including:
  - injection defense string present verbatim;
  - all four adversarial notes stay under the 2,600-token budget;
  - schema rejects unknown keys and enum values;
  - low-confidence cluster decisions are separated for human review;
  - cloud payload excludes `rawNote`, `photo`, and `reporterId`.

## Remaining work

1. Enforce the missing-regency confidence rule in validation, then remeasure.
2. Add a numeric plausibility bound (or a review flag) for extreme counts.
3. Measure `sitrep.cluster.v1` and `sitrep.daily.v1` with the same harness.
4. Repeat on Chrome 139+ with Nano and record local latency/source.
5. Do not wire extraction into the UI automatically while field accuracy is
   below 90%; edits remain mandatory.

## Known limitation

The Firebase SDK installed here (v13) accepts `temperature` only in
`inCloudParams.generationConfig`; the on-device create options do not expose a
temperature field. Determinism on the local path therefore relies on the prompt
and validation, not a sampler setting.
