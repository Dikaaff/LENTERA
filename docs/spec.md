# LENTERA — Frozen Spec v1.0

Frozen: 2026-11-13. Changes require a new ticket and a note in
`docs/decisions/assumptions.md`.

## Problem

Field volunteers lose reports because capture depends on connectivity and
structured forms demand retyping. Coordinators cannot deduplicate what arrives
as free text.

## Who is harmed

Relawan, kader posyandu, and kurir logistik working multi-day outages; the
admin who must file a SITREP from fragments.

## The one workflow that must be flawless

1. Volunteer opens **Isi Laporan** in airplane mode.
2. Writes an Indonesian or English note, optionally attaches one JPEG/PNG.
3. Taps **Proses laporan**. The app calls `initializeDeviceModel` from that
   gesture, then `runTask("report.extract.v1", ...)`.
4. A card appears with every field editable. Invalid output is never rendered as
   fact: it is marked `perlu ditinjau`.
5. Volunteer corrects fields, taps **Simpan ke antrean**.
6. **Antrean** shows the report as `menunggu` and the status bar shows the held
   count and the path used.
7. Reload while offline: the report is still there.
8. Reconnect: the report becomes `terkirim` with the same ID; no duplicate.
9. Admin opens **SITREP**, grants cloud consent once, generates the daily
   narrative, and taps any claim to open its source report.

If any step fails, the failure is visible in the selected language; the report is
never discarded.

## Non-goals

- Chat, multi-turn conversation, streaming chat UI.
- Live tracking, notifications, SMS, WhatsApp.
- Backend services beyond Firestore and Firebase AI Logic.
- Victim identity storage.
- Offline basemap tiles.

## Done criteria (testable)

- [ ] Note + photo yields a Zod-valid extraction with enum-safe urgency/category.
- [ ] The result object names the path actually used (`inferenceSource`).
- [ ] Local path emits zero Firebase AI requests (Network evidence pending).
- [ ] Queue survives reload offline and syncs without duplicate IDs.
- [ ] Conflict row shows a visible badge; last-write-wins limitation documented.
- [ ] Emergency export downloads the full local queue as JSON.
- [ ] SITREP ≤ 250 words in the selected language, every claim carries a report ID.
- [ ] Rules tests deny cross-volunteer reads and synced-report edits.
- [ ] Prompt suite includes 4 adversarial cases and a token budget assertion.
- [ ] Build, typecheck, tests, boundaries pass from a clean clone.

## Feature → inference path

| Feature                           | Task artifact                     | Declared mode      | Why                                  |
| --------------------------------- | --------------------------------- | ------------------ | ------------------------------------ |
| Note/photo → structured report    | `report.extract.v1`               | `PREFER_ON_DEVICE` | Frequent, private, must work offline |
| Urgency classification            | inside `report.extract.v1`        | `PREFER_ON_DEVICE` | Same pass, no second prompt          |
| PII masking                       | rule-based, no model              | none               | Deterministic, auditable             |
| Deduplication / clustering        | `sitrep.cluster.v1`               | `PREFER_IN_CLOUD`  | Needs cross-report context           |
| Daily narrative SITREP            | `sitrep.daily.v1`                 | `ONLY_IN_CLOUD`    | Long context, quality matters        |
| Over-budget note (> 4,000 tokens) | `report.extract.v1` cloud variant | `ONLY_IN_CLOUD`    | Documented local ceiling             |
| Map shading                       | local aggregation                 | none               | No model needed                      |

## Approved feature list

Capture, extraction, offline queue, local map, cloud dedup + SITREP, consent
gate, Relawan/Admin roles. Reject anything else.

## Assumptions

- Firebase project values arrive through env vars.
- Province-level schematic geometry is acceptable for v1.
- Admin identity uses Google sign-in only; volunteer uses anonymous auth.
