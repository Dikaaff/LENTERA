# ADR-002 — Firestore is the queue, not localStorage alone

Status: accepted · 2026-11-13

## Context

Reports must survive a page reload, a dead battery, and days without signal.
They must later reach a coordinator without creating duplicates. A localStorage
array is durable but invisible to the rest of Firebase, easy to lose on storage
eviction, and not shared with rules or auth.

## Decision

Each report is a Firestore document with a client-generated UUID and a small
status machine: `draft → queued → synced`, plus `conflict`. Firestore
persistent local cache is enabled with a multi-tab manager. The queue module
also mirrors rows to localStorage so the UI can render before Firebase is
configured, and so an emergency export never depends on the SDK.

Writes are local-first: persist, show the row, then attempt the network write.
A failed network write leaves the row `queued`, never discards it.

## Consequences

- Pending writes replay on reconnect and after a reload.
- Client-generated IDs make retries idempotent.
- Firestore resolves concurrent document writes last-write-wins; LENTERA detects
  a newer remote `updatedAt` and marks `conflict` for a human instead of
  overwriting silently.
- The queue module is the only module allowed to import Firestore.
- Without Firebase config the same status machine runs against the local
  adapter; the UI labels the mode "lokal saja".
