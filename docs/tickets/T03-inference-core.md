# T03 — Inference entry point

Status: done
Blocked by: T02

## Outcome

One export: `runTask(taskName, input, options)`. It maps task → prompt artifact
and schema, selects the declared mode, initializes the device model on a user
gesture, calls `generateContent`, validates with Zod, retries once in cloud on
validation failure, and records the real `inferenceSource`.

## Done when

- No other module imports `firebase/ai`.
- Missing Firebase config returns a typed `unavailable` result, never a crash.
- Every result carries path, duration, artifact name/version, and reason.
- Over-budget extraction routes to cloud before attempting local.
