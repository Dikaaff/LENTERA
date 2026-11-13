# T02 — Report schema and status machine

Status: done
Blocked by: none

## Outcome

`src/modules/reports` exports the Zod schema, inferred types, the status union
(`draft | queued | synced | conflict`), and pure helpers for masking reporter
PII. It imports no Firebase and no React.

## Done when

- Unit tests reject unknown enum values and unknown keys.
- A numeric range populates both bounds.
- Masking replaces Indonesian phone numbers and labelled names with tokens.
