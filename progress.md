# LENTERA — Progress Ledger

Live task log. Updated after each completed task.
Last update: 2026-11-13, session 3.

## Legend

- `[x]` done, evidence named
- `[~]` code done, live verification pending
- `[ ]` pending
- `[!]` blocked

## Phase status

| Phase | Name                               | Status                                            |
| ----- | ---------------------------------- | ------------------------------------------------- |
| F0    | Research and problem framing       | [x] PRD + 4 research notes                        |
| F1    | Domain model                       | [x] glossary + 3 ADRs                             |
| F2    | Spec and tickets                   | [x] spec + 12 tickets                             |
| F3    | Constitution, scaffold, guardrails | [x] AGENTS, depcruise, husky, setup wizard        |
| F4    | Brand, logo, design system         | [x] brand.md, design.md, 3 SVG assets             |
| F5    | Inference core                     | [~] 44 tests + 36/36 cloud calls; Nano unmeasured |
| F6    | Data layer and offline queue       | [x] emulator + live sync verified                 |
| F7    | Prompt artifacts                   | [~] 3 artifacts; cloud measured, Nano unmeasured  |
| F8    | UI                                 | [x] 4 screens + status bar + consent              |
| F9    | Security                           | [x] 11 rules tests pass; rules + hosting deployed |
| F10   | QA and hardening                   | [x] local gates pass; evidence gaps recorded      |
| F11   | Submission package                 | [x] README, LICENSE, video script, docs           |
| F12   | Close                              | [x] retro + checkpoint                            |

## Task log

| ID  | Task                                                           | Status | Evidence                                                |
| --- | -------------------------------------------------------------- | ------ | ------------------------------------------------------- |
| T01 | Install recommended skills (mattpocock set, ponytail, caveman) | [x]    | `.agents/skills/`, `skills-lock.json`                   |
| T02 | Initialise git repo and origin `Dikaaff/LENTERA`               | [x]    | `git remote -v`                                         |
| T03 | Scaffold Vite + React + TS + Tailwind + PWA                    | [x]    | `package.json`, `vite.config.ts`, `dist/`               |
| T04 | Research notes with sources and access dates                   | [x]    | `docs/research/*.md` (4 files)                          |
| T05 | PRD (F0 gate)                                                  | [x]    | `PRD.md`                                                |
| T06 | Domain glossary, 11 terms                                      | [x]    | `docs/domain/glossary.md`                               |
| T07 | Three ADRs                                                     | [x]    | `docs/decisions/adr-00{1,2,3}*.md`                      |
| T08 | Frozen spec + feature→path table                               | [x]    | `docs/spec.md`                                          |
| T09 | Tracer tickets T01–T12                                         | [x]    | `docs/tickets/`                                         |
| T10 | Constitution + module boundaries                               | [x]    | `AGENTS.md`, `.dependency-cruiser.cjs`                  |
| T11 | Pre-commit + operator wizard                                   | [x]    | `.husky/pre-commit`, `scripts/setup.sh`                 |
| T12 | Brand, logo, favicon, design system                            | [x]    | `docs/brand.md`, `docs/design.md`, `public/logo*.svg`   |
| T13 | Report schema + PII masking                                    | [x]    | `src/modules/reports/**`                                |
| T14 | Inference entry point + policy                                 | [x]    | `src/modules/inference/run.ts`                          |
| T15 | Three versioned prompt artifacts                               | [x]    | `src/modules/inference/prompts/*.ts`                    |
| T16 | Local-first queue + export                                     | [x]    | `src/modules/queue/**`                                  |
| T17 | Firestore sync + conflict flag                                 | [x]    | emulator E2E: `terkirim` + reload; conflict unit-tested |
| T18 | Consent gate + SITREP helpers                                  | [x]    | `src/modules/sitrep/**`                                 |
| T19 | Four screens + status bar                                      | [x]    | `src/screens/**`, `src/App.tsx`                         |
| T20 | Offline SVG province map                                       | [x]    | `src/modules/map/*` (336 KB GeoJSON)                    |
| T21 | Firestore rules + access mirror                                | [x]    | `firestore.rules`, 11 emulator tests                    |
| T22 | Unit tests                                                     | [x]    | 44 tests, 7 files, all pass                             |
| T23 | Typecheck / boundaries / build                                 | [x]    | all exit 0                                              |
| T24 | README, Apache-2.0, video script                               | [x]    | `README.md`, `LICENSE`, `docs/video-script.md`          |
| T25 | QA, security evidence, metrics, assumptions                    | [x]    | `docs/qa.md`, `docs/security/`, `docs/prompts/`         |
| T26 | Retro + checkpoint                                             | [x]    | `docs/retro.md`, `docs/state/checkpoint.md`             |
| T27 | Runtime boot check                                             | [x]    | dev HTTP 200 + headless Chrome rendered all four tabs   |
| T28 | Firestore rules emulator suite                                 | [x]    | 11/11 pass, `tests/rules.emulator.test.ts`              |
| T29 | Browser walkthrough                                            | [x]    | `E2E_PASS`: capture → save → sync → reload → map        |
| T30 | Fix sync badge bug                                             | [x]    | `includeMetadataChanges: true` + `resumeSync` on boot   |
| T31 | Resume queued report after reload                              | [x]    | `scripts/e2e-resume.mjs`, `RESUME_OK`                   |
| T32 | Cloud 12-case measurement harness                              | [x]    | 36/36 ok; `docs/prompts/cloud-metrics.json`             |
| T33 | Deploy rules + hosting to real project                         | [x]    | `lentera-6f2a-db3a1`; deploy exit 0                     |
| T34 | Hosting security headers                                       | [x]    | verified on live domain                                 |
| T35 | Provision Firebase AI Logic config                             | [x]    | PATCH config 200; cloud calls served                    |
| T36 | Enable Anonymous Auth on Spark                                 | [x]    | console step done; `accounts:signUp` 200                |
| T37 | Live smoke of deployed URL                                     | [x]    | `/` and `/antrean` 200; `docs/evidence/deploy-live.png` |
| T38 | Live report save + reload                                      | [x]    | `E2E_LIVE_PASS`; `docs/evidence/live-terkirim.png`      |

## Verification snapshot

```
npm run check       -> 44 unit tests pass; typecheck + boundaries clean
npm run test:rules  -> 11/11 Firestore emulator tests pass
npm run build       -> pass; PWA precache 9 entries; no demo config in bundle
emulator E2E        -> capture → sync terkirim → reload → map: PASS
emulator resume E2E -> queued report synced after reload: PASS
hosting emulator    -> /antrean returns 200 and the SPA shell
npm run measure:cloud -> 36/36 ok; schema 1.0; field accuracy 0.875
firebase deploy     -> exit 0; rules + hosting released
live URL            -> https://lentera-6f2a-db3a1.web.app (HTTP 200)
live sign-in        -> anonymous 200; app shows RELAWAN
live save           -> badge terkirim; DITAHAN 0; survives reload
```

## Push log

| #   | Commit                                            | Pushed | Note                             |
| --- | ------------------------------------------------- | ------ | -------------------------------- |
| 1   | `b8e9372` scaffold: full LENTERA app, tests, docs | yes    | `git push -u origin main` exit 0 |
| 2   | `3f059d4` docs: verified push + boot check        | yes    | `git push` exit 0                |
| 3   | `3a1cdee` emulator rules + E2E + sync fix         | yes    | `git push` exit 0                |
| 4   | `d7f9cc3` emulator verification log               | yes    | `git push` exit 0                |
| 5   | `b695ef2` resume E2E + cloud harness + deploy     | yes    | `git push` exit 0                |
| 6   | `0eed755` deploy live + cloud metrics             | yes    | `git push` exit 0                |
| 7   | `83bcf19` verify live auth + save                 | yes    | `git push` exit 0                |

`gh auth status` reports no login, but the cached git credential completes the
push. Future pushes use the same remote and fail loudly if credentials expire.

## Blockers

1. **No Nano-capable Chrome.** On-device path unmeasured.
2. **No App Check enforcement.** AI Logic answered without it; the production
   reCAPTCHA key is still unset.
3. **Coordinator docs are not seeded.** Needs a signed-in Google uid.
4. **SITREP artifacts unmeasured.** Only `report.extract.v1` has live cloud
   numbers.

## Live verification (session 3)

- `accounts:signUp` with the web API key returned 200 after Anonymous Auth was
  enabled.
- Headless Chrome against the live URL signed in as `RELAWAN`, saved one report,
  and showed `TERKIRIM` with `DITAHAN 0`; the report survived a reload.
- Log: `AUTH_OK`, `LIVE_SYNC_OK`, `LIVE_RELOAD_OK`, `E2E_LIVE_PASS`. Screenshot:
  `docs/evidence/live-terkirim.png`.
- The saved report used the manual fallback (`JALUR: MANUAL`), not a model call,
  because no Nano model is available on this desktop.

## Cloud measurement snapshot

`MEASURE_CONFIRM=1 MEASURE_PACE_MS=5000 npm run measure:cloud` on
2026-11-13: 36 calls, 36 ok, 0 rate-limited, all `in_cloud`. Schema-valid 1.0;
field accuracy 0.875 (21/24); avg 2,603 ms; p95 6,033 ms. Only mismatch:
`missing-regency` returned `confidence: high` instead of `low` in 3/3 runs.
`extreme-numbers` was labelled report (`is_report: true`) in 3/3 runs even
though the fixture expects rejection; this is a prompt-policy gap, not a schema
failure. Detail: `docs/prompts/cloud-metrics.json`.
