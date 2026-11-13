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
- Not executed: Firebase emulator rules tests. `@firebase/rules-unit-testing`
  and the emulator were not installed in this session. Command to run once Java
  and the emulator are available:
  `firebase emulators:exec --only firestore "npm run test:rules"` (the test file
  still needs to be written; see "Pending" below).

## Layer 2 — API surface

- App Check: debug provider behind `VITE_APP_CHECK_DEBUG=1`; production path is
  reCAPTCHA Enterprise (`VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`).
- Client rate limiting: not implemented. The queue is user-triggered; a cloud
  retry happens at most once per validation failure. This is a known gap for a
  hostile user, documented rather than hidden.

## Layer 3 — Data and privacy

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

1. Add emulator rules tests and run them.
2. Register reCAPTCHA Enterprise site key and enforce App Check for AI Logic.
3. Capture Network evidence for local and cloud paths.
4. Add a per-user rate limit at the app layer if public traffic is expected.
5. Rotate the App Check debug token if it was ever pasted into a shared channel.
