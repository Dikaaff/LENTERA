# Devpost submission — LENTERA

Everything in this file is copy-paste ready for the #BuildHybridAI 2026 Devpost
form. Manual steps are marked **HUMAN**.

## Name

LENTERA — Field reports that survive when the network does not

## Elevator pitch

LENTERA turns a free-form field note and one photo into a validated structured
report on-device, queues it offline, syncs it when signal returns, and rolls the
survivors into a daily SITREP. Gemini Nano handles the private, frequent
extraction; Gemini in the cloud handles the cross-report work that needs a larger
context window. Every response names the path it actually used.

## Inspiration

Disaster volunteers in Indonesia write notes in WhatsApp groups, on paper, and in
their heads. When the network drops, the report is lost or duplicated. Cloud-only
AI is unusable in the first 72 hours, and on-device AI alone cannot deduplicate a
province. LENTERA is built around that split.

## What it does

1. A volunteer writes a note in Indonesian or English and optionally attaches one
   JPEG/PNG.
2. `runTask("report.extract.v1")` prefers Gemini Nano. The note is untrusted data:
   instruction-like text is recorded in `note_anomaly`, never executed. Output is
   validated by Zod before it reaches the screen.
3. The extraction appears as an editable card. A failed validation retries once in
   the cloud; a second failure is kept with `needs_review: true`.
4. Saving writes to a local-first queue. The row visibly says `menunggu`,
   `terkirim`, `perlu ditinjau`, or `konflik`; failures are never hidden behind a
   spinner.
5. When the network returns, the queue syncs to Firestore without duplicating IDs.
6. A coordinator grants cloud consent, then runs deduplication and a ≤250-word
   SITREP. Reporter names and phone numbers are masked before egress; the token
   map never leaves the device.

The UI is Indonesian by default with an English toggle. The selected language
also drives the model's output language.

## How it uses hybrid AI

| Path      | Model                                                              | Work                                                       | Why                                                  |
| --------- | ------------------------------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------- |
| On device | Gemini Nano via Firebase AI Logic (`PREFER_ON_DEVICE`)             | note + photo → structured extraction                       | private, frequent, must work in airplane mode        |
| Cloud     | Gemini via Firebase AI Logic (`PREFER_IN_CLOUD` / `ONLY_IN_CLOUD`) | deduplication, clustering, daily SITREP, over-budget notes | needs cross-report context and a larger token budget |

- **Firebase AI Logic is the only AI runtime.** The app imports `firebase/ai`
  exclusively from `src/modules/inference`. There is no direct Gemini SDK, no
  OpenAI, no local WebLLM, and no fetch to a model endpoint.
- Routing is declared policy, not `navigator.onLine`. The SDK's reported
  `inferenceSource` is persisted with every report and shown in the status bar.
- A token estimate above 4,000 routes a note straight to the cloud.
- Cloud egress is consent-gated. Refusal keeps the on-device path available.

## Built with

Firebase AI Logic · Gemini Nano · Gemini · Firebase Authentication · Cloud
Firestore · Firebase App Check (reCAPTCHA Enterprise) · React · TypeScript ·
Vite · Tailwind CSS · Zod · Workbox PWA · Vite PWA

## Try it

- Live: <https://lentera-6f2a-db3a1.web.app>
- Repo: <https://github.com/Dikaaff/LENTERA>
- Local: `npm install && cp .env.example .env.local && npm run dev`
- Gates: `npm run check` (53 unit tests), `npm run test:rules` (11 emulator rules
  tests), `npm run build`.

### Five-minute judge path

1. Open the live URL and choose **Relawan lapangan** / **Field volunteer**.
2. Paste: `Ada 30 keluarga di balai desa Sukamaju, butuh air bersih dan selimut. Jalan longsor.`
3. Press **Proses laporan**. Review the extraction card; edit a field.
4. Press **Simpan ke antrean**, open **Antrean**, and read the visible path label.
5. Toggle **ID → EN**; the shell and the next model output switch language.
6. Open **SITREP**, accept the consent panel, run **Deduplikasi** and
   **Susun SITREP**; every claim links to a source report.

No seed data is required. The queue is local to the browser, so a judge's test
report never appears in another judge's session.

## What is verified

- 53 unit tests + typecheck + dependency boundaries + production build pass.
- 11 real Firestore emulator rules tests pass (cross-volunteer denial, synced-edit
  denial, forged reporter, raw-note rejection, coordinator scoping).
- Browser E2E: capture → consent → fallback → save → sync (`terkirim`) → reload →
  map.
- Cloud extraction: 36/36 calls succeeded on `gemini-3.5-flash-lite` via Firebase
  AI Logic; 100% schema-valid; 87.5% field accuracy in the first run, 95.8% after
  the prompt fix.
- SITREP harness: 3/3 cluster + 3/3 daily calls schema-valid, every claim sourced.
- Live URL serves the SPA and the configured security headers.

## Known limitations

- No Nano-capable Chrome/device was attached during development, so the on-device
  latency and zero-request Network proof are not measured. The app shows the real
  path (`perangkat`, `cloud`, `manual`) instead of claiming one.
- Chrome's Prompt API does not officially support Indonesian. Prompts are in
  English and instruct the model to answer in the selected language; cloud
  fallback covers quality failures.
- App Check is configured in the client but **enforcement is pending** (see
  below).
- Map geometry is province-level and schematic; the newest four Papua provinces
  are not separate shapes in the licensed source.
- Conflict handling prevents silent last-write-wins but does not merge fields.

## Manual blockers (HUMAN)

These cannot be completed from the development session:

1. **Firebase CLI credentials are invalid.** Re-run `firebase login --reauth`,
   then `FIREBASE_PROJECT=lentera-6f2a-db3a1 bash scripts/deploy.sh` to publish
   the bilingual build and the PIN-free login screen.
2. **App Check enforcement.** In Firebase Console → App Check → APIs, set AI Logic
   (and Firestore when ready) to **Enforced**. Confirm the web app is registered
   with the reCAPTCHA Enterprise site key used at build time. Verify a cloud call
   succeeds with a real token and fails with a missing one.
3. **Video.** Record ≤3 minutes in English, following
   `docs/video-script.md`; upload to YouTube (public or unlisted) and paste the
   link into Devpost.
4. **Devpost form.** Paste the sections above, add the repo and live URL, select
   the Firebase AI Logic / Gemini tracks, and submit before
   **30 Nov 2026 14:00 PT (1 Dec 2026 05:00 WIB)**.

## Video checklist

- [ ] 0:00–0:20 problem and who has it
- [ ] 0:20–0:40 live app, volunteer path
- [ ] 0:40–1:20 extraction card, offline queue, visible status
- [ ] 1:20–1:50 hybrid proof: path label + explanation of Nano vs cloud
- [ ] 1:50–2:20 consent panel, PII masking, SITREP with source links
- [ ] 2:20–2:40 ID/EN toggle
- [ ] 2:40–3:00 limits stated plainly and repo URL
