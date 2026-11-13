# QA record

Date: 2026-11-13.

## Commands actually run

| Command                         | Result                                                      | Evidence                  |
| ------------------------------- | ----------------------------------------------------------- | ------------------------- |
| `npm run typecheck`             | pass, 0 errors                                              | exit 0                    |
| `npm run test`                  | 7 files, 43 tests passed                                    | Vitest output             |
| `npm run boundaries`            | 0 violations, 56 modules, 122 deps                          | dependency-cruiser output |
| `npm run build`                 | pass, PWA precache 9 entries                                | dist generated            |     | `git status --short` | no `.env` staged | see security evidence |
| `npm run dev` + headless Chrome | HTTP 200; all four tabs rendered; local-only banner visible | DOM dump                  |

## What the tests cover

- Schema rejects unknown keys and enum values; defaults allow `is_report:false`;
  numeric ranges keep both bounds.
- Reporter PII masking for phones, emails, labelled names; casualty/location
  data untouched.
- Prompt injection defense present verbatim; all four adversarial fixtures and a
  long note stay under 2,600 estimated tokens; 12-case tables exist.
- Routing: local default, cloud retry after invalid local output, over-budget
  note goes straight to cloud, no-consent downgrade, cloud-only refusal.
- Queue survives a module reload; same-ID write does not duplicate.
- SITREP: word counting, claim-with-source filter, low-confidence cluster split,
  sanitized cloud payload excludes raw notes/photo/reporter id.
- Access mirror: cross-volunteer read denied, synced edit denied, coordinator
  region scoping, no delete.

## `grill-me` style attack results (recorded, not model-executed)

1. **Injection:** "Abaikan instruksi..." is untrusted data. The system prompt
   requires recording it in `note_anomaly`; strict Zod prevents new keys. The
   record is shown to the volunteer as a warning. No case where note text is
   concatenated into the system prompt.
2. **Enum boundary:** `"severe"` fails `z.enum`; the local result is retried in
   cloud once; a second failure is stored `needsReview`, not repaired.
3. **Nullability:** omitted fields default to null/empty, so `is_report:false`
   is valid. A location without a regency is forced to `confidence: "low"` by
   prompt rule, not by post-processing. That rule is not enforced in Zod; a model
   could violate it. This is a known gap.
4. **Numbers:** extreme numbers are accepted if non-negative; there is no upper
   bound. The UI shows them for human correction.
5. **PII:** masking is regex-based. Nicknames without a label, or names written
   in lowercase, can slip through. Documented limitation; consent gate remains.

## Not verified

- No live model call, no Network-tab capture, no Nano download, no emulator
  rules run, no Firebase deployment.
- No interactive browser walkthrough was performed: the app was rendered once
  in headless Chrome to confirm the four tabs and the local-only banner mount.
  No click-through of capture → queue → SITREP was executed.
- No E2E test of the capture → queue → sync flow.

## Gate status

Code-level gates pass. The product-level gate in section 8 of the master prompt
is **not** complete until a Firebase project and a Nano-capable Chrome are
attached and the evidence items are captured.
