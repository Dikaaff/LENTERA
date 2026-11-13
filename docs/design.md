# LENTERA — Design system

## Direction

`industrial-brutalist` field instrument, chosen over a minimalist editorial
look because sunlight legibility, gloved hands, and night use favor hard edges,
flat surfaces, and large targets over soft cards and whitespace.

## Non-negotiable UI rules

- Dark by default (`#0b0f0e`); no light theme in v1.
- Flat surfaces, 1 px borders, zero corner radius.
- Minimum touch target 44 × 44 px; primary button 44 px tall.
- Contrast: ink on base > 12:1; muted on base ≥ 4.5:1.
- One accent color per screen. Amber means "act or look here".
- No gradients, blobs, glassmorphism, emoji icons, stock illustrations,
  decorative animation, or lorem ipsum.
- Animation only communicates a state change: list entry, count tick, spinner.
- Numerals tabular everywhere, including report IDs and counts.

## Layout

- Mobile-first single column, tested at 360 px.
- Max width 28 rem, centered with side borders on desktop.
- Header: mark, product name, role badge.
- Four tabs: Isi, Antrean, Peta, SITREP.
- Persistent status bar above tabs: inference path + held count. This is the
  product thesis made visible.

## Components

| Component                  | Source                           | Rule                     |
| -------------------------- | -------------------------------- | ------------------------ |
| Button, card, badge, field | shadcn/ui pattern, hand-authored | no radius, amber primary |
| Extraction card            | product-specific                 | every field editable     |
| NumberTicker               | Magic UI pattern, CSS/rAF        | counts only              |
| BlurFade                   | Magic UI pattern, CSS            | list entry only          |
| Map                        | custom SVG + bundled GeoJSON     | no tile server           |

No component library beyond these. No animation library, no state library.

## Empty and failure states

Every failure names the cause and the next action in Indonesian: no Firebase,
no network, no Nano, invalid model output, conflict. Never a bare spinner,
never a silent discard.
