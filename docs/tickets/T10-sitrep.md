# T10 — SITREP, clustering, consent gate

Status: done (code), unverified (live)
Blocked by: T03, T04, T05

## Outcome

Consent panel before first cloud egress. Cluster task deduplicates and maps
report IDs to canonical IDs with confidence; decisions below 0.6 are flagged.
Daily task renders ≤ 250 Indonesian words with per-claim source links.

## Done when

- Refusing consent blocks cloud calls and keeps local processing available.
- Low-confidence cluster decisions are visible, not applied silently.
- Claims without a report ID are not rendered.
