# Chrome Prompt API — constraints that shape LENTERA

Accessed: 2026-11-13.

Sources:

- https://developer.chrome.com/docs/ai/get-started
- https://developer.chrome.com/docs/ai/prompt-api
- https://firebase.google.com/docs/ai-logic/hybrid/web/get-started

## Facts carried into the design

- On-device inference is Chrome Desktop only, v139+.
- The Prompt API language support is limited to `en`, `ja`, `es`, `de`, `fr`.
  Indonesian is not in that list.
- Model download is roughly 4 GB; Chrome requires free disk space and an
  unmetered connection for the download.
- Single-turn only. No conversation state on the on-device path.

## Mitigation applied

- System prompts, few-shot examples, JSON keys, and enum values are English.
- The prompt instructs the model to write human-facing string values in
  Indonesian.
- Indonesian input is still sent as data. If extraction quality collapses, the
  task falls back to cloud and the failure is visible in the result metadata.
- No chat UI exists anywhere in the product.

## Test status

Not executed in this environment: no Chrome 139+ desktop profile with the
multimodal Nano model is available to this session. The limitation is recorded
in `docs/research/local-language-findings.md` and in the README rather than
claimed as working.
