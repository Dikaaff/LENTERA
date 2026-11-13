# Security evidence

Date: 2026-11-13. No Firebase project was attached to this session, so this file
separates verified local behavior from deployment steps that remain.

## Layer 1 — Identity and authorization

- Relawan: Firebase Anonymous Auth (`ensureVolunteer`).
- Koordinator: Google sign-in (`signInCoordinator`).
- Rules: `firestore.rules` — owner read/write scoped by `reporterId`;
  coordinator read scoped to `coordinators/{uid}.region`; no client delete;
  coordinator update limited to `needsReview`.
- Local proof: `src/modules/security/__tests__/access.test.ts` mirrors the rules
  in pure functions and asserts:
  - volunteer B cannot read volunteer A's report;
  - a guest cannot read or create;
  - a volunteer cannot edit a synced report;
  - a coordinator from another region cannot read;
  - deletion is always false.
- **Executed:** 11 Real Firestore emulator rules tests pass via
  `npm run test:rules` (Firestore emulator 1.22.0, JRE 21 local). File:
  `tests/rules.emulator.test.ts`. It seeds coordinator and report documents with
  rules disabled, then asserts allowed and denied operations per role.
- Verified denials: cross-volunteer read, unauthenticated read, forged
  `reporterId`, `rawNote`/`photo` fields in a cloud write, edit of a synced
  report, deletion, coordinator from another region, unverified coordinator
  token, and coordinator rewrites beyond `needsReview`.

## Layer 2 — API surface

- App Check: debug provider behind `VITE_APP_CHECK_DEBUG=1`; production path is
  reCAPTCHA Enterprise (`VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`).
- Client rate limiting: not implemented. The queue is user-triggered; a cloud
  retry happens at most once per validation failure. This is a known gap for a
  hostile user, documented rather than hidden.

## Layer 3 — Data and privacy

- End-to-end verified against Auth + Firestore emulators: anonymous volunteer →
  save → Firestore write → `terkirim` badge → reload persistence. Screenshot:
  `docs/evidence/e2e-antrean.png`. The payload sent excludes `rawNote`, `photo`,
  and reporter PII; the emulator rules reject those keys when present.

- `maskReporterPII` replaces Indonesian phone numbers, emails, and labelled
  reporter names with tokens before any model call. Token map stays in memory.
- `sanitizedReports` sends only `{id, region, createdAt, extraction}` to cloud.
  `rawNote`, `photo`, and `reporterId` never leave the device through the SITREP
  path. `toRemote` in `queue/sync.ts` also strips `rawNote` and `photo`.
- Consent gate: `src/modules/sitrep/consent.ts`; capture downgrades
  `PREFER_ON_DEVICE` to `ONLY_ON_DEVICE` when consent is absent, so a cloud
  fallback cannot happen silently.
- Evidence pending: Network-tab screenshot of a local-path extraction with zero
  Firebase AI requests. No Nano device is attached to this session.

## Layer 4 — Output integrity

- Every model response passes the task Zod schema before UI or Firestore.
- Unknown keys and unknown enum values fail validation; no auto-repair.
- Failed local validation retries once in cloud; a failed retry is stored with
  `needsReview: true`, never dropped.
- Injection defense exists in the prompt (verbatim block tested) and in the
  validation layer (strict schema).

## Secret sweep

Commands run locally:

- `git status --short` — no `.env` file staged; `.env*` is ignored except
  `.env.example`.
- `grep -rn "apiKey\\s*=\\s*['\\\"]" src` — no hardcoded key.
- `grep -rn "allow read, write: if true" .` — no such rule.
- Debug token is never written into the repo; `VITE_APP_CHECK_DEBUG` only
  toggles the provider at runtime.

## Pending before public deployment

1. Register reCAPTCHA Enterprise site key and enforce App Check for AI Logic.
2. Capture Network evidence for local and cloud AI paths.
3. Add a per-user rate limit at the app layer if public traffic is expected.
4. Rotate the App Check debug token if it was ever pasted into a shared channel.
