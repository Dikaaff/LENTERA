# LENTERA — Product Requirements

Version 1.0 · 2026-11-13

## One line

Field reports that survive when the network does not.

## Who is harmed today

Volunteers, posyandu health workers, and logistics couriers in disaster response
write notes in private chats or on paper. During an outage they cannot file
anything. After signal returns they retype from memory, lose details, or send
duplicates. Coordinators then assemble a situation report from inconsistent
messages, often hours late.

## Users and jobs to be done

| User             | Job                                               | Today             | With LENTERA                                              |
| ---------------- | ------------------------------------------------- | ----------------- | --------------------------------------------------------- |
| Relawan lapangan | Record what I saw before I forget, without signal | Notes app / paper | Free-form note + photo becomes a validated card on-device |
| Kader posyandu   | Send health needs with correct quantities         | Chat message      | Structured needs, urgency, location, editable before save |
| Kurir logistik   | Keep a durable list of deliveries while moving    | Paper list        | Offline queue with a visible held count and JSON export   |
| Koordinator      | Produce one daily situation report                | Manual copy-paste | Clustered, deduplicated SITREP with claim-to-source links |

## Product thesis (the hybrid split)

- **On device (Gemini Nano via Firebase AI Logic):** extract notes and photos
  into structured JSON, classify urgency, mask reporter PII. Zero network, zero
  egress, zero cost.
- **Cloud (Gemini via Firebase AI Logic):** deduplicate across reports, cluster
  by region, write the daily SITREP, and extract notes that exceed the on-device
  budget.
- **Visible routing:** a persistent status bar names the path used and the queue
  depth. The routing decision is also stored on each report.

## The one workflow that must be flawless

Write a note in airplane mode → see a structured card → correct a field → save
→ see it in the queue as `menunggu` → restore signal → watch it become
`terkirim` with no duplicate → generate a SITREP with a source link per claim.

## Approved features (nothing else ships)

1. Note and photo capture.
2. On-device structured extraction.
3. Offline queue with sync indicator.
4. Local GeoJSON map.
5. Cloud deduplication and daily SITREP.
6. Consent gate before the first cloud egress.
7. Relawan and Koordinator roles.

## Non-goals

- Chat with the model. The on-device path is single-turn only.
- Live location tracking, push notifications, SMS gateway, WhatsApp import.
- A backend service beyond Firestore and Firebase AI Logic.
- Storing victim identities. Reporter-identifying data is masked before egress;
  casualty and location data are core product data and are not masked.
- Offline tile maps. The map must work in airplane mode with bundled geometry.

## Success metrics

| Metric                            | Target                                | Measurement                                   |
| --------------------------------- | ------------------------------------- | --------------------------------------------- |
| Extraction schema accuracy        | ≥ 90%                                 | held-out suite in `docs/prompts/metrics.md`   |
| Local-path interactive latency    | < 2 s                                 | recorded per call in the observability object |
| Duplicate prevention              | 0 duplicates after reload + reconnect | queue test + manual QA                        |
| Cross-volunteer read denial       | 100% denied                           | rules unit tests                              |
| Token budget                      | total ≤ 2,600 of 4,000                | automated prompt test                         |
| Offline capture to validated card | works with network disabled           | manual evidence capture                       |

## Honest constraints

- The on-device path needs Chrome Desktop 139+ and a ~4 GB model download.
- Indonesian is not an officially supported Prompt API language. The English
  prompt + Indonesian output instruction is a mitigation, not a guarantee.
- Without a Firebase project, the build runs in local-only mode: no cloud
  inference, no sync. The UI says so instead of pretending.
