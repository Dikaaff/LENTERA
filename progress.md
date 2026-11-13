# LENTERA — Progress Ledger

Live task log. Updated after each completed task.
Last update: 2026-11-13, session 1.

## Legend

- `[x]` done, evidence named
- `[~]` code done, live verification pending
- `[ ]` pending
- `[!]` blocked

## Phase status

| Phase | Name                               | Status                                                  |
| ----- | ---------------------------------- | ------------------------------------------------------- |
| F0    | Research and problem framing       | [x] PRD + 4 research notes                              |
| F1    | Domain model                       | [x] glossary + 3 ADRs                                   |
| F2    | Spec and tickets                   | [x] spec + 12 tickets                                   |
| F3    | Constitution, scaffold, guardrails | [x] AGENTS, depcruise, husky, setup wizard              |
| F4    | Brand, logo, design system         | [x] brand.md, design.md, 3 SVG assets                   |
| F5    | Inference core                     | [~] code + 43 tests; no live model                      |
| F6    | Data layer and offline queue       | [~] code + tests; Firestore unverified                  |
| F7    | Prompt artifacts                   | [~] 3 artifacts + adversarial tests; metrics unmeasured |
| F8    | UI                                 | [x] 4 screens + status bar + consent                    |
| F9    | Security                           | [~] rules + mirror tests; emulator/deploy pending       |
| F10   | QA and hardening                   | [x] local gates pass; evidence gaps recorded            |
| F11   | Submission package                 | [x] README, LICENSE, video script, docs                 |
| F12   | Close                              | [x] retro + checkpoint                                  |

## Task log

| ID  | Task                                                           | Status | Evidence                                              |
| --- | -------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| T01 | Install recommended skills (mattpocock set, ponytail, caveman) | [x]    | `.agents/skills/`, `skills-lock.json`                 |
| T02 | Initialise git repo and origin `Dikaaff/LENTERA`               | [x]    | `git remote -v`                                       |
| T03 | Scaffold Vite + React + TS + Tailwind + PWA                    | [x]    | `package.json`, `vite.config.ts`, `dist/`             |
| T04 | Research notes with sources and access dates                   | [x]    | `docs/research/*.md` (4 files)                        |
| T05 | PRD (F0 gate)                                                  | [x]    | `PRD.md`                                              |
| T06 | Domain glossary, 11 terms                                      | [x]    | `docs/domain/glossary.md`                             |
| T07 | Three ADRs                                                     | [x]    | `docs/decisions/adr-00{1,2,3}*.md`                    |
| T08 | Frozen spec + feature→path table                               | [x]    | `docs/spec.md`                                        |
| T09 | Tracer tickets T01–T12                                         | [x]    | `docs/tickets/`                                       |
| T10 | Constitution + module boundaries                               | [x]    | `AGENTS.md`, `.dependency-cruiser.cjs`                |
| T11 | Pre-commit + operator wizard                                   | [x]    | `.husky/pre-commit`, `scripts/setup.sh`               |
| T12 | Brand, logo, favicon, design system                            | [x]    | `docs/brand.md`, `docs/design.md`, `public/logo*.svg` |
| T13 | Report schema + PII masking                                    | [x]    | `src/modules/reports/**`                              |
| T14 | Inference entry point + policy                                 | [x]    | `src/modules/inference/run.ts`                        |
| T15 | Three versioned prompt artifacts                               | [x]    | `src/modules/inference/prompts/*.ts`                  |
| T16 | Local-first queue + export                                     | [x]    | `src/modules/queue/**`                                |
| T17 | Firestore sync + conflict flag                                 | [~]    | `src/modules/queue/sync.ts`; live run pending         |
| T18 | Consent gate + SITREP helpers                                  | [x]    | `src/modules/sitrep/**`                               |
| T19 | Four screens + status bar                                      | [x]    | `src/screens/**`, `src/App.tsx`                       |
| T20 | Offline SVG province map                                       | [x]    | `src/modules/map/*` (336 KB GeoJSON)                  |
| T21 | Firestore rules + access mirror                                | [~]    | `firestore.rules`, `security/__tests__`               |
| T22 | Unit tests                                                     | [x]    | 43 tests, 7 files, all pass                           |
| T23 | Typecheck / boundaries / build                                 | [x]    | all exit 0                                            |
| T24 | README, Apache-2.0, video script                               | [x]    | `README.md`, `LICENSE`, `docs/video-script.md`        |
| T25 | QA, security evidence, metrics, assumptions                    | [x]    | `docs/qa.md`, `docs/security/`, `docs/prompts/`       |
| T26 | Retro + checkpoint                                             | [x]    | `docs/retro.md`, `docs/state/checkpoint.md`           |

## Verification snapshot

```
npm run typecheck   -> pass
npm run test        -> 7 files, 43 tests passed
npm run boundaries  -> 0 violations (56 modules)
npm run build       -> pass; PWA precache 9 entries
```

## Push log

| #   | Commit                                  | Pushed     | Note                                 |
| --- | --------------------------------------- | ---------- | ------------------------------------ |
| 1   | scaffold: full LENTERA app, tests, docs | attempting | `gh` unauthenticated; see note below |

Push attempts are recorded with their exact result. Local commits are never
lost if the remote rejects.

## Blockers

1. **No Firebase project config.** AI and Firestore cannot execute. The app
   reports this in the UI; nothing is faked.
2. **No Nano-capable Chrome.** On-device path unmeasured.
3. **GitHub CLI unauthenticated.** `git push` may fail until credentials exist.
4. **No emulator/Java.** Rules unit tests against the real emulator are pending.
