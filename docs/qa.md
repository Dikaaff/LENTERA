# QA record

Date: 2026-11-13.

## Commands actually run

| Command                         | Result                                | Evidence                                  |
| ------------------------------- | ------------------------------------- | ----------------------------------------- |
| `npm run typecheck`             | pass, 0 errors                        | exit 0                                    |
| `npm run test`                  | 7 files, 44 unit tests passed         | Vitest output                             |
| `npm run test:rules`            | 11 emulator rules tests passed        | Firestore emulator + Vitest               |
| `npm run boundaries`            | 0 violations, 57 modules              | dependency-cruiser                        |
| `npm run build`                 | pass; PWA precache 9 entries          | `dist/`                                   |
| `npm run dev` + headless Chrome | HTTP 200; four tabs render            | DOM dump                                  |
| emulator E2E walkthrough        | capture → queue → sync → reload → map | `docs/evidence/e2e-*.png`                 |
| `node scripts/e2e-resume.mjs`   | queued report synced after reload     | `docs/evidence/e2e-resume.png`            |
| hosting emulator                | `/antrean` 200; SPA shell served      | `/tmp/hosting2.log`                       |
| `npm run measure:cloud`         | blocked, exit 2, no real project      | `docs/prompts/cloud-metrics.blocked.json` |
| `firebase deploy`               | blocked, exit 1, not authenticated    | `docs/evidence/deploy-blocked.txt`        |

## What the tests cover

- Schema rejects unknown keys and enum values; defaults allow `is_report:false`;
  numeric ranges keep both bounds.
- Reporter PII masking for phones, emails, labelled names; casualty/location
  data untouched.
- Prompt injection defense present verbatim; all four adversarial fixtures and a
  long note stay under 2,600 estimated tokens; 12-case tables exist.
- Routing: local default, cloud retry after invalid local output, over-budget
  note goes straight to cloud, no-consent downgrade, cloud-only refusal.
- Queue survives a module reload; same-ID write does not duplicate; a remote
  acknowledgement becomes `synced`; a newer remote copy becomes `conflict`.
- SITREP: word counting, claim-with-source filter, low-confidence cluster split,
  sanitized cloud payload excludes raw notes/photo/reporter id.
- Rules mirror: cross-volunteer read denied, synced edit denied, coordinator
  region scoping, no delete.
- **Real emulator rules:** volunteer A reads own report; volunteer B is denied;
  unauthenticated is denied; create-for-someone-else is denied; raw note/photo
  fields are rejected; synced edit is denied; delete is denied; coordinator
  reads own region only; coordinator may flag but not rewrite; unverified
  coordinator token is denied.
- **Browser E2E:** consent gate appears, local fallback renders an editable card,
  save reaches Firestore emulator, badge becomes `terkirim`, held count returns
  to 0, reload keeps the report, map renders the province with 1 report.
- **Resume E2E:** a report injected into `lentera.queue.v1` with `status: queued`
  (simulating a previous session) is uploaded by `resumeSync` after reload; both
  records reach `synced` and the held count is 0.

## Bug found and fixed by the walkthrough

Firestore does not emit a listener update when only metadata changes, so a
successful upload left the local badge at `menunggu` forever. `watchReport` now
passes `{ includeMetadataChanges: true }`. The walkthrough also exposed that a
reload did not resume pending uploads; `resumeSync` now runs after sign-in on
boot.

## `grill-me` style attack results (recorded, not model-executed)

1. **Injection:** "Abaikan instruksi..." is untrusted data. The system prompt
   requires recording it in `note_anomaly`; strict Zod prevents new keys. The
   record is shown to the volunteer as a warning. No case where note text is
   concatenated into the system prompt.
2. **Enum boundary:** `"severe"` fails `z.enum`; the local result is retried in
   cloud once; a second failure is stored `needsReview`, not repaired.
3. **Nullability:** omitted fields default to null/empty, so `is_report:false`
   is valid. A location without a regency is forced to `confidence: "low"` by
   prompt rule, not by post-processing. That rule is not enforced in Zod; a model
   could violate it. This is a known gap.
4. **Numbers:** extreme numbers are accepted if non-negative; there is no upper
   bound. The UI shows them for human correction.
5. **PII:** masking is regex-based. Nicknames without a label, or names written
   in lowercase, can slip through. Documented limitation; consent gate remains.

## Cloud measurement and deploy attempts

- `scripts/measure-cloud.mjs` drives the real `runTask` in the page with
  `forceCloud` and 3 runs per case, then writes
  `docs/prompts/cloud-metrics.json`. It refuses to run without
  `MEASURE_CONFIRM=1`.
- It exited **2** here: the dev server is in emulator mode and the only project
  id is `lentera-demo`. The reason is recorded in
  `docs/prompts/cloud-metrics.blocked.json`; no metric was invented.
- `scripts/deploy.sh` refuses the demo project and stale emulator flags. Both
  guards return exit 2.
- Hosting emulator served `/antrean` with HTTP 200 and the SPA shell, so the
  rewrite is valid. It does **not** emit the configured security headers, so
  those remain unverified until real Hosting.

## Not verified

- No live model call (cloud or Nano), therefore no accuracy, A/B, latency, or
  Network-tab zero-request evidence. The harness is ready but blocked.
- No Nano download screenshot; no Chrome 139+ profile.
- No two-device conflict reproduction; conflict logic is unit-tested only.
- No Firebase deployment: `firebase deploy` exits 1 with
  "Failed to authenticate". No reCAPTCHA Enterprise enforcement.
- Hosting security headers are configured but not observable in the emulator.

## Gate status

Data, queue, rules, and the manual fallback are verified end-to-end against the
emulator. The AI-quality gate is **not** complete until a Firebase project and a
Nano-capable Chrome are attached.
