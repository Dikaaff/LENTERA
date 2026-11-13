# ADR-003 — Bundled GeoJSON map, not online tiles

Status: accepted · 2026-11-13

## Context

The map is used in airplane mode, at night, by a volunteer checking which
regency has the most unmet needs. Online tile providers fail offline, leak
requests, and add a dependency with an API key.

## Decision

Ship simplified Indonesian province geometry as a static `.geojson` asset and
render it with inline SVG. Shade by report count. Tapping a province filters the
report list below the map. No tile server, no map SDK, no runtime network.

## Consequences

- The map renders in airplane mode and inside the PWA cache.
- Geometry is deliberately simplified and labelled as schematic; it is not
  authoritative for boundaries or area measurement.
- Only province-level aggregation is available. Regency detail is a future
  upgrade that would need a larger bundled asset.
- The map module stays a deep module: geometry + projection + shading behind a
  small screen component.
