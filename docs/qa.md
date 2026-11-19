# QA record

Date: 2026-11-19.

## Commands actually run

| Command                         | Result                                | Evidence                          |
| ------------------------------- | ------------------------------------- | --------------------------------- |
| `npm run typecheck`             | pass, 0 errors                        | exit 0                            |
| `npm run test`                  | 7 files, 53 unit tests passed         | Vitest output                     |
| `npm run test:rules`            | 11 emulator rules tests passed        | Firestore emulator + Vitest       |
| `npm run boundaries`            | 0 violations, 66 modules              | dependency-cruiser                |
| `npm run build`                 | pass; PWA precache 9 entries          | `dist/`                           |
| `npm run dev` + headless Chrome | HTTP 200; four tabs render            | DOM dump                          |
| emulator E2E walkthrough        | capture → queue → sync → reload → map | `docs/evidence/e2e-*.png`         |
| `node scripts/e2e-resume.mjs`   | queued report synced after reload     | `docs/evidence/e2e-resume.png`    |
| hosting emulator                | `/antrean` 200; SPA shell served      | `/tmp/hosting2.log`               |
| `npm run measure:cloud`         | 36/36 ok; schema 1.0; accuracy 0.875  | `docs/prompts/cloud-metrics.json` |
| `bash scripts/deploy.sh <id>`   | exit 0; rules + hosting released      | `/tmp/deploy-real.log`            |
| live URL smoke                  | `/` and `/antrean` HTTP 200           | `docs/evidence/deploy-live.png`   |
| live security headers           | all configured headers present        | `curl -I` output                  |
| live sign-in + save             | RELAWAN → `terkirim` → reload         | `docs/evidence/live-terkirim.png` |

## What the tests cover

- Schema rejects unknown keys and enum values; defaults allow `is_report:false`;
  numeric ranges keep both bounds.
- Reporter PII masking for phones, emails, labelled names; casualty/location
  data untouched.
- Prompt injection defense present verbatim; all four adversarial fixtures and a
  long note stay under 2,600 estimated tokens; 12-case tables exist.
- Language: the extraction prompt switches to English few-shots and an English
  output instruction; cluster `reason` and SITREP claim text receive an explicit
  English instruction; inference rejection reasons are localized.
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

## Cloud measurement

- `scripts/measure-cloud.mjs` drives the real `runTask` in the page with
  `forceCloud` and 3 runs per case, then writes
  `docs/prompts/cloud-metrics.json`. It refuses to run without
  `MEASURE_CONFIRM=1`.
- First run hit HTTP 429 on 19/36 calls (free tier: 15 requests/minute). The
  successful, paced rerun (`MEASURE_PACE_MS=5000`) produced 36/36 ok, schema
  valid 1.0, field accuracy 0.875 (21/24), average 2,603 ms, p95 6,033 ms, all
  `in_cloud`. It is recorded in `docs/prompts/cloud-metrics.json`.
- Only mismatch: `missing-regency` returned `confidence: high` instead of `low`
  in 3/3 runs. `extreme-numbers` was accepted as a report in 3/3 runs although
  the fixture expects rejection. Both are prompt/validation gaps, not transport
  or schema failures.

## Deploy

- `bash scripts/deploy.sh lentera-6f2a-db3a1` exited 0 and released Firestore
  rules and Hosting.
- Live URL <https://lentera-6f2a-db3a1.web.app>: `/` and `/antrean` return 200.
- Live headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options:
DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy:
camera=(self), microphone=(), geolocation=()`, and HSTS.
- The live bundle carries project `lentera-6f2a-db3a1`.
- Deploy guards still reject `lentera-demo`, emulator flags, and a mismatched
  `.env.local` (exit 2).
- Anonymous Auth is active (`accounts:signUp` 200). Headless Chrome signed in as
  `RELAWAN`, saved one report, saw `TERKIRIM` with `DITAHAN 0`, and kept it after
  reload (`AUTH_OK`, `LIVE_SYNC_OK`, `LIVE_RELOAD_OK`, `E2E_LIVE_PASS`). The run
  shows `JALUR: MANUAL` because Nano is unavailable on this desktop.

## Not verified

- No model-backed live save: the live proof used the manual fallback
  (`JALUR: MANUAL`), not Nano or cloud.
- No Nano call or screenshot; no Chrome 139+ profile.
- No two-device conflict reproduction; conflict logic is unit-tested only.
- App Check enforcement is not verified. The client initializes reCAPTCHA
  Enterprise when the site key is present, but the Firebase CLI credentials in
  this session are invalid, so the console state could not be read or changed.
  Earlier cloud calls answered without attestation.
- `sitrep.cluster.v1` and `sitrep.daily.v1` are still unmeasured.

## Gate status

Data, queue, rules, and the manual fallback are verified end-to-end against the
emulator, and the live write path is verified from sign-in through `terkirim`
and reload. Extraction is measured on cloud at 87.5% field accuracy, below the
90% bar for automatic wiring, so edits stay mandatory. The model-backed
on-device half remains unmeasured without Nano, and App Check is not enforced.
