# LENTERA — Brand

## Idea

A field instrument, not a startup landing page. One light source in a dark
housing: the mark is a lantern read as a location pin. Amber is reserved for
action and attention, never decoration.

## Palette — seven tokens, no more

| Token     | Hex       | Use                                        |
| --------- | --------- | ------------------------------------------ |
| base      | `#0b0f0e` | app background, night field                |
| surface   | `#141b19` | cards, bars                                |
| line      | `#2a3532` | borders, map strokes                       |
| ink       | `#eef4f0` | primary text                               |
| muted     | `#9aa8a2` | secondary text, metadata                   |
| amber     | `#ffb020` | primary action, active state, light source |
| emergency | `#ff5347` | critical urgency, conflict, refusal        |
| synced    | `#43c08a` | synced state, local model confirmed        |

Every interface color traces to one of these. No gradients. No purple. No glass.

## Type

- UI: IBM Plex Sans (fallback Segoe UI, system-ui).
- Numerals and IDs: IBM Plex Mono.
- Scale: 11 / 12 / 14 / 16 / 20 / 30 px. Display sizes are not used.
- Numerals always tabular.
- Uppercase labels: 11 px, 0.08–0.18 em tracking, semibold.

## Logo

Construction, not vibe:

- 24 × 24 grid, 2 px stroke, butt caps, miter joins.
- Outer form: pointy-top hexagon, readable as lantern glass and location pin.
- Inner light: solid 4 × 4 square, offset 2 px upward, amber only.
- Frame: one horizontal 8+ px rule crossing the hexagon at ~40% height.
- Monochrome first. No gradient, shadow, 3D, or literal lantern illustration.
- At 16 px the rule may drop out; hexagon and square stay legible.

Files: `public/logo.svg`, `public/logo-lockup.svg` (uppercase geometric
wordmark, +4% letter-spacing), `public/favicon.svg` (dark field background).

## Voice

Indonesian, plain, operational. State what happened and what is needed. No
marketing adjectives, no emoji, no exclamation marks. English is used only in
code, JSON keys, enum values, and prompts.
