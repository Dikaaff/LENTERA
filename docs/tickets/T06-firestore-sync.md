# T06 — Firestore sync and conflict badge

Status: done (code), unverified (live)
Blocked by: T05

## Outcome

When Firebase config exists, queue writes mirror to `reports/{id}` and a
snapshot listener marks remote rows. A newer remote `updatedAt` on a locally
dirty row sets `conflict`. Offline persistence is enabled once per app.

## Done when

- Live: two clients, same id, newer remote copy shows the conflict badge.
- Local: comparison helper covered by tests.
- Without config the UI says "lokal saja" and sync never pretends to work.
