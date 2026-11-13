# ADR-001 — Extraction prefers the device, not the cloud

Status: accepted · 2026-11-13

## Context

Extraction is the highest-frequency AI task: every saved note runs it. The
product exists for volunteers without connectivity. Every cloud call adds cost,
latency, and data egress for a note that may contain reporter-identifying text.

## Decision

`report.extract.v1` declares `PREFER_ON_DEVICE`. The inference module asks the
SDK for that mode and records `inferenceSource` on the result. It does not check
`navigator.onLine` to choose a path. The cloud remains the fallback when Nano is
absent, the model is still downloading, the input exceeds the 4,000-token
routing ceiling, or local validation fails.

## Consequences

- The default experience is offline-capable and free at the margin.
- A device without Nano still produces a report through the cloud path; the UI
  must never look broken.
- Local output quality, especially for Indonesian, can be worse than cloud. The
  prompt metrics table must publish both numbers.
- `ONLY_IN_CLOUD` is never the default for extraction because it would make the
  product's core promise false.
