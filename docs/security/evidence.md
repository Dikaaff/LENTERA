# Security evidence

Date: 2026-11-19. Rules and Hosting are deployed to `lentera-6f2a-db3a1`
(<https://lentera-6f2a-db3a1.web.app>), and anonymous Auth is active. This file
separates verified behavior from steps that remain, notably App Check
enforcement. The deployed bundle may lag this working tree until the guarded
deploy runs again.

## Layer 1 — Identity and authorization

- Relawan: Firebase Anonymous Auth (`ensureVolunteer`).
- Admin: Google sign-in only (`signInAdmin`). The hardcoded access PIN and its
  local admin marker were removed in this working tree; no shared secret ships
  in the client.
- Rules: `firestore.rules` — owner read/write scoped by `reporterId`; admin read
  scoped to `coordinators/{uid}.region` (collection name is legacy); no client
  delete; admin update limited to `needsReview`.
- Local proof: `src/modules/security/__tests__/access.test.ts` mirrors the rules
  in pure functions and asserts:
  - volunteer B cannot read volunteer A's report;
  - a guest cannot read or create;
  - a volunteer cannot edit a synced report;
  - an admin from another region cannot read;
  - deletion is always false.
- **Executed:** 11 real Firestore emulator rules tests pass via
  `npm run test:rules` (Firestore emulator 1.22.0, JRE 21 local). File:
  `tests/rules.emulator.test.ts`. It seeds admin and report documents with
  rules disabled, then asserts allowed and denied operations per role.
- Verified denials: cross-volunteer read, unauthenticated read, forged
  `reporterId`, `rawNote`/`photo` fields in a cloud write, edit of a synced
  report, deletion, coordinator from another region, unverified coordinator
  token, and coordinator rewrites beyond `needsReview`.

## Layer 2 — API surface

- App Check: debug provider behind `VITE_APP_CHECK_DEBUG=1`; production path is
  reCAPTCHA Enterprise (`VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`). `initializeAppCheck`
  registers the reCAPTCHA Enterprise provider with auto-refresh whenever the site
  key is present at build time.
- **App Check enforcement is not verified.** The local build has a reCAPTCHA
  Enterprise site key, but the Firebase CLI credentials for this session are no
  longer valid, so the console enforcement state could not be read or changed.
  Earlier cloud measurements succeeded without attestation; treat enforcement as
  pending until the console shows **Enforced** for AI Logic and Firestore.
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
- `grep -rn "ADMIN_PIN\\|12345678" src` — no hardcoded admin PIN.
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
- Live anonymous sign-in returns 200. Headless Chrome saved one report as
  `RELAWAN`, saw `TERKIRIM` with `DITAHAN 0`, and kept it after reload. Evidence:
  `docs/evidence/live-terkirim.png`. The save used the manual fallback, so this
  proves the Auth/rules/queue path, not a model path.

## Pending before public deployment

1. Set App Check to **Enforced** for AI Logic (and Firestore when ready) in the
   Firebase console; the client provider is configured, enforcement is not.
2. Capture Network evidence for local and cloud AI paths.
3. Add a per-user rate limit at the app layer if public traffic is expected.
4. Rotate the App Check debug token if it was ever pasted into a shared channel.
5. Seed `coordinators/{uid}` and verify coordinator scoping live.
