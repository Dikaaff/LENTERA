# Local-language findings — Indonesian on-device

Status: NOT EXECUTED.

## Why

This build session has no Chrome 139+ desktop environment with
`chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` enabled, no
~4 GB Nano multimodal model downloaded, and no Firebase project configured.
Running a synthetic "result" would violate the evidence-over-assertion rule.

## What is known from official documentation

- Chrome's Prompt API accepts only `en`, `ja`, `es`, `de`, `fr`.
- Indonesian is not supported as a declared input/output language.
- Firebase AI Logic hybrid mode lets us declare English model expectations while
  sending Indonesian text as data, and instruct the model in English to emit
  Indonesian values.

## Exact test to run on capable hardware

1. Open the app in Chrome 139+ with the multimodal flag enabled.
2. Click "Siapkan model lokal" and let `initializeDeviceModel` finish.
3. Paste an Indonesian note (see `src/modules/inference/prompts/__tests__`).
4. Record `inferenceSource`, latency, schema validity, and whether summary/needs
   are Indonesian.
5. If invalid, confirm the one cloud retry fires and `unverified` is never
   silently shown as verified.
6. Paste the numbers into `docs/prompts/metrics.md`.

Until step 6 happens, the README must say "untested on this machine".
