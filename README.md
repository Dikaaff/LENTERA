# LENTERA

**Field reports that survive when the network does not.**

LENTERA is a mobile-first PWA for disaster relief volunteers, posyandu health
workers, and field logistics couriers in Indonesia. A free-form Indonesian or
English note and an optional photo become a validated structured report entirely
on the device, enter a local-first Firestore queue, sync when signal returns, and
roll up into a daily situation report for coordinators.

The interface ships in Indonesian by default with an English toggle, so judges and
international coordinators can use the same build without a separate translation.

Built for the **#BuildHybridAI** challenge using **Firebase AI Logic hybrid
inference**: Gemini Nano on-device when possible, Gemini in the cloud when not.

**Live:** <https://lentera-6f2a-db3a1.web.app> — rules, hosting, and anonymous
Auth are active. A live headless run signed in as `RELAWAN`, saved a report, saw
`TERKIRIM`, and kept it after reload: `docs/evidence/live-terkirim.png`.

![LENTERA mark](public/logo-lockup.svg)

## Judge quickstart (5 minutes)

1. Open <https://lentera-6f2a-db3a1.web.app> and choose **Relawan lapangan**
   (volunteer). No account is required.
2. Paste one of the sample notes from `docs/demo/script.json`, for example:
   `Ada 30 keluarga di balai desa Sukamaju, butuh air bersih dan selimut. Jalan longsor.`
3. Press **Proses laporan**. The extraction card shows category, urgency, location,
   people affected, and needs. Edit anything before saving.
4. Press **Simpan ke antrean**. Open **Antrean** and confirm the row is visible
   with its inference path (`perangkat`, `cloud`, or `manual`).
5. Switch the header toggle from **ID** to **EN**; navigation, statuses, and the
   next model output follow the selected language.
6. Open **SITREP**, accept the cloud consent panel, and run **Deduplikasi** or
   **Susun SITREP** to see claims with source-report links.

App Check, deployment, and the recorded video are manual steps. The exact
submission checklist is in `docs/submission/devpost.md`.

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
- **SITREP** — consent-gated deduplication and a ≤250-word narrative in the
  selected language, every claim linked to its source report.
- **Bahasa / Language** — Indonesian default, English toggle; the choice also
  sets the model's output language for extraction, cluster reasons, and SITREP.
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
npm run check   # typecheck + 53 unit tests + boundaries
npm run build   # production PWA build
```

### Local emulator verification

No Firebase project is required for the data and rules halves. Java 17+ is
needed for the Firestore emulator.

```bash
npm run test:rules   # 11 real emulator rules tests
```

For the browser walkthrough, start the app in emulator mode (it loads the
committed `.env.emulator`; production builds never see these values), then run
the emulator-backed script in a second terminal:

```bash
npm run dev:emulator      # terminal 1

# terminal 2
npx firebase emulators:exec --only auth,firestore --project lentera-demo \
  "node scripts/e2e-smoke.mjs"
```

It drives capture → local fallback → save → Firestore sync (`terkirim`) →
reload → map, and writes screenshots to `docs/evidence/`. `VITE_DISABLE_AI=1`
skips model calls so this test exercises the manual fallback, not model quality.

```bash
node scripts/e2e-resume.mjs   # queued report survives reload, then syncs
```

The resume test injects a `status: "queued"` record into the local queue and
reloads; only `resumeSync` can turn it into `terkirim`.

### Firebase setup

1. Create a project, enable Firestore, Authentication (Anonymous + Google), and
   AI Logic with the Gemini Developer API.
2. Register a web app and copy the config into `.env.local`.
3. For local development, set `VITE_APP_CHECK_DEBUG=1`, open the app, copy the
   debug token from the console, and register it under **Security → App Check →
   Apps → Manage debug tokens**. Never commit the token.
4. For production, set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` and enforce App Check
   for AI Logic.
5. Deploy rules and hosting with the guarded script:
   `FIREBASE_PROJECT=<id> bash scripts/deploy.sh`. It refuses `lentera-demo`,
   stale emulator flags, and a mismatch with `.env.local`. See `docs/deploy.md`.
   Seed `coordinators/{uid}` with `{ region: "Jawa Barat" }` for each coordinator.
   Coordinator identity needs `email_verified == true`.
6. Measure cloud quality with `MEASURE_CONFIRM=1 npm run measure:cloud`.

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

| Artifact            | Path            | Temperature | Output                              |
| ------------------- | --------------- | ----------- | ----------------------------------- |
| `report.extract.v1` | on-device first | 0 (cloud)   | structured extraction               |
| `sitrep.cluster.v1` | cloud           | 0           | canonical IDs + confidence          |
| `sitrep.daily.v1`   | cloud           | 0.3         | 4-section SITREP in the UI language |

Every artifact lives in `src/modules/inference/prompts/`, is versioned, carries
a 12-case table, and is tested. The extraction system prompt contains a verbatim
injection defense: notes are untrusted data, instruction-like text is recorded in
`note_anomaly`, never followed. Token budget is asserted at ≤2,600 of the 4,000
routing ceiling. See `docs/prompts/metrics.md`.

## Evidence and honesty

**Measured in this repo:**

- 53 unit tests pass; typecheck, dependency boundaries, and production build pass.
- 11 Firestore emulator rules tests pass, including cross-volunteer denial and
  synced-report edit denial.
- Headless Chrome walkthrough passes: capture → consent → manual fallback →
  save → Firestore emulator sync (`terkirim`) → reload persistence → map.
  Evidence: [queue](docs/evidence/e2e-antrean.png) and
  [map](docs/evidence/e2e-peta.png).
- 36/36 cloud extraction calls succeeded on `gemini-3.5-flash-lite` via Firebase
  AI Logic: schema-valid 100%, field accuracy 87.5% (21/24), average 2,603 ms,
  p95 6,033 ms, all `in_cloud`. Raw data:
  [cloud-metrics.json](docs/prompts/cloud-metrics.json).
- Firestore rules and Hosting are live at the URL above; `/` and `/antrean`
  return 200, and the configured security headers are present.
- Live Auth + save: anonymous sign-in 200, badge `terkirim`, held count 0, and
  the report survives reload. The run used the manual fallback because Nano is
  unavailable on this desktop.

A real bug was found by that walkthrough and fixed: Firestore metadata-only
changes do not fire a listener by default, so a successful upload never flipped
to `terkirim`. `watchReport` now uses `includeMetadataChanges: true`, and the
sync-resume path runs on boot after sign-in. A second walkthrough injects a
queued record, reloads, and proves that resume uploads it.

Hosting rewrite was verified locally and live: `/antrean` returns 200 and the
SPA shell. Security headers were verified on the real domain.

**Not measured or not enabled:**

- local vs cloud A/B numbers; no Chrome 139+ Nano profile is attached,
- zero-request Network-tab proof for the local path,
- `sitrep.cluster.v1` and `sitrep.daily.v1` quality,
- Nano download screenshot,
- real conflict behavior across two devices,
- reCAPTCHA Enterprise / App Check enforcement,
- a model-backed live save: the live proof used the manual fallback (`JALUR:
MANUAL`), not Nano or cloud.

Extraction field accuracy is 87.5%, below the 90% bar for automatic wiring, so
the editable card stays mandatory. These limits are recorded in
`docs/prompts/metrics.md`, `docs/qa.md`, and `docs/security/evidence.md` rather
than claimed.

Other known limitations:

- Chrome's Prompt API does not officially support Indonesian. System prompts stay
  in English; every user-facing model output is instructed to follow the selected
  UI language; cloud fallback exists. This is a mitigation, not a guarantee.
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
src/modules/security/__tests__       rules mirror: cross-volunteer denial
tests/rules.emulator.test.ts        11 real emulator rules tests
scripts/e2e-smoke.mjs               capture → queue → sync → reload → map
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

## Data attribution

The bundled province geometry in `src/modules/map/indonesia.geojson` is derived
from geoBoundaries IDN ADM1 (ODbL-1.0), which is in turn derived from
OpenStreetMap. The file is simplified in-repo and remains ODbL-1.0; the
application source remains Apache-2.0. Attribution and change notes are in
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

## License

Apache-2.0. See [LICENSE](./LICENSE). Bundled data keeps its own license as noted
above.
