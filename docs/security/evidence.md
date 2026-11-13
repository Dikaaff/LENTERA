# Security evidence

Date: 2026-11-13. Rules and Hosting are deployed to `lentera-6f2a-db3a1`
(<https://lentera-6f2a-db3a1.web.app>). This file separates verified behavior
from steps that remain, notably Authentication and App Check.

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
- **Executed:** 11 real Firestore emulator rules tests pass via
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
- **App Check is not enforced yet.** No reCAPTCHA Enterprise site key is set.
  AI Logic answered 36/36 cloud calls without an App Check token, so the current
  project is not protected by attestation. This is a deployment gap, not a
  verified control.
- Client rate limiting: not implemented. The queue is user-triggered; a cloud
  retry happens at most once per validation failure. The model's free tier
  enforces 15 requests/minute server-side, which the measurement harness paces
  under. This is a known gap for a hostile user, documented rather than hidden.

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

## Deployment evidence

- `bash scripts/deploy.sh lentera-6f2a-db3a1` exited 0 and released Firestore
  rules plus Hosting.
- Live `/` and `/antrean` return HTTP 200 with the SPA shell.
- Live response headers include `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(self), microphone=(), geolocation=()`, and HSTS.
- The deployed bundle contains project `lentera-6f2a-db3a1`; no demo config or
  `VITE_DISABLE_AI` flag is present in the production build.

## Pending before public deployment

1. Initialize Anonymous Auth in the console and verify a live save reaches
   `terkirim`; the public API returns `BILLING_NOT_ENABLED` on Spark.
2. Register reCAPTCHA Enterprise site key and enforce App Check for AI Logic.
3. Capture Network evidence for local and cloud AI paths.
4. Add a per-user rate limit at the app layer if public traffic is expected.
5. Rotate the App Check debug token if it was ever pasted into a shared channel.
