# LENTERA

**Field reports that survive when the network does not.**

LENTERA is a mobile-first PWA for disaster relief volunteers, posyandu health
workers, and field logistics couriers in Indonesia. A free-form Indonesian note
and an optional photo become a validated structured report entirely on the
device, enter a local-first Firestore queue, sync when signal returns, and roll
up into a daily situation report for coordinators.

Built for the **#BuildHybridAI** challenge using **Firebase AI Logic hybrid
inference**: Gemini Nano on-device when possible, Gemini in the cloud when not.

![LENTERA mark](public/logo-lockup.svg)

## Why hybrid, specifically

| Path                    | Work                                                                | Why there                                         |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| On device (Gemini Nano) | note/photo → structured JSON, urgency, category                     | frequent, private, must work offline, zero egress |
| Cloud (Gemini)          | deduplication, regional clustering, daily SITREP, over-budget notes | needs cross-report context and a larger budget    |

The routing decision is visible in a persistent status bar and recorded on every
report. The app never infers the path from `navigator.onLine`; policy decides,
and the SDK reports the path it actually used (`response.inferenceSource`).

## Features

- **Isi Laporan** — note + one JPEG/PNG, extraction rendered as an editable card.
- **Antrean** — local-first queue with `menunggu`, `terkirim`, `perlu ditinjau`,
  `konflik`, a held-count ticker, and an emergency JSON export.
- **Peta** — bundled Indonesian province GeoJSON rendered as SVG; works in
  airplane mode; shading by report density.
- **SITREP** — consent-gated deduplication and a ≤250-word Indonesian narrative,
  every claim linked to its source report.
- **Roles** — anonymous volunteer, Google-signed-in coordinator.
- **Privacy** — reporter names/phones masked before any model call; raw notes and
  photos never leave the device.

## Architecture

```
 note + photo
      │
      ▼
 src/modules/inference/runTask ── declared policy ──► Gemini Nano (PREFER_ON_DEVICE)
      │                                                   │ invalid output
      │                                                   ▼
      │                                             one cloud retry
      ▼
 Zod schema (strict) ──► editable card ──► src/modules/queue (local-first)
      │                                          │
      │                                          ├─ Firestore persistent cache
      │                                          ├─ status: queued → synced | conflict
      │                                          └─ emergency JSON export
      ▼
 src/modules/sitrep: sanitized reports ──► cluster (cloud) ──► daily SITREP (cloud)
```

Deep modules and enforced boundaries:

```
src/modules/reports    schema, types, masking, status (no Firebase, no React)
src/modules/inference  the only importer of firebase/ai
src/modules/queue      the only importer of firebase/firestore
src/modules/sitrep     consent, sanitization, SITREP helpers
src/modules/map        bundled geometry + projection
src/modules/auth       volunteer/coordinator identity
src/modules/security   rules mirror and tests
```

`npm run boundaries` fails the build on a violation.

## Run it

Requirements: Node 20+, npm 10+.

```bash
npm install
cp .env.example .env.local   # fill VITE_FIREBASE_*
npm run dev
```

Without env values the app runs in **local-only demo mode**: capture, manual
editing, queue, export, and map work; AI and sync say they are unavailable
instead of pretending. That is intentional.

```bash
npm run check   # typecheck + 43 tests + boundaries
npm run build   # production PWA build
```

### Firebase setup

1. Create a project, enable Firestore, Authentication (Anonymous + Google), and
   AI Logic with the Gemini Developer API.
2. Register a web app and copy the config into `.env.local`.
3. For local development, set `VITE_APP_CHECK_DEBUG=1`, open the app, copy the
   debug token from the console, and register it under **Security → App Check →
   Apps → Manage debug tokens**. Never commit the token.
4. For production, set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` and enforce App Check
   for AI Logic.
5. Deploy rules and hosting: `npx firebase deploy --only firestore:rules,hosting`.
   Seed `coordinators/{uid}` with `{ region: "Jawa Barat" }` for each coordinator.
   Coordinator identity needs `email_verified == true`.

`scripts/setup.sh` walks through the human-only steps.

### On-device bonus path

- Chrome **Desktop 139+**.
- Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
- ~4 GB download; use an unmetered connection.
- The app calls `initializeDeviceModel()` on the submit gesture and forwards
  download progress to the button label.

No phone, Safari, or Firefox can run the local model. Cloud remains the default
fallback so the app never looks broken on those devices.

## Prompt artifacts

| Artifact            | Path            | Temperature | Output                      |
| ------------------- | --------------- | ----------- | --------------------------- |
| `report.extract.v1` | on-device first | 0 (cloud)   | structured extraction       |
| `sitrep.cluster.v1` | cloud           | 0           | canonical IDs + confidence  |
| `sitrep.daily.v1`   | cloud           | 0.3         | 4-section Indonesian SITREP |

Every artifact lives in `src/modules/inference/prompts/`, is versioned, carries
a 12-case table, and is tested. The extraction system prompt contains a verbatim
injection defense: notes are untrusted data, instruction-like text is recorded in
`note_anomaly`, never followed. Token budget is asserted at ≤2,600 of the 4,000
routing ceiling. See `docs/prompts/metrics.md`.

## Evidence and honesty

**Measured in this repo:** 43 unit tests pass; typecheck passes; dependency
boundaries pass; production build passes.

**Not measured, because no Firebase project or Nano device was attached to the
build session:**

- live extraction accuracy (target ≥90%),
- local vs cloud A/B numbers,
- zero-request Network-tab proof for the local path,
- Nano download screenshot,
- emulator rules run,
- real sync/conflict behavior across two devices.

These are marked pending in `docs/prompts/metrics.md`, `docs/qa.md`, and
`docs/security/evidence.md` rather than claimed. The exact procedure to produce
them is written down. Running the app without `.env.local` demonstrates the
local-first half truthfully.

Other known limitations:

- Chrome's Prompt API does not officially support Indonesian. Prompts are
  English; output values are instructed to be Indonesian; cloud fallback exists.
  This is a mitigation, not a guarantee.
- Map geometry is province-level and schematic, not authoritative regency
  boundaries.
- Conflict handling is last-write-wins prevention (flag a newer remote copy), not
  field-level merge.
- Regex PII masking can miss unlabelled nicknames.
- On-device sampling temperature is not exposed by Firebase JS SDK v13.
- Retrieval, chat, audio, video, and PDF input are out of scope.

## Tests

```
src/modules/reports/__tests__        schema, masking, status
src/modules/inference/__tests__      routing, validation, retry, consent
src/modules/inference/prompts/__tests__  injection, budget, adversarial cases
src/modules/queue/__tests__          offline persistence, idempotent writes
src/modules/sitrep/__tests__         word cap, claims, cluster confidence
src/modules/security/__tests__       cross-volunteer denial, synced edit denial
```

## Repo map

```
PRD.md                  product framing
docs/spec.md            frozen workflow + feature→path table
docs/domain/glossary.md Indonesian domain vocabulary
docs/decisions/         3 ADRs + assumptions
docs/research/          source-backed API notes
docs/security/          rules evidence
docs/qa.md              what ran and what did not
docs/state/             checkpoint + skill audit
progress.md             live task ledger
```

## License

Apache-2.0. See [LICENSE](./LICENSE).
