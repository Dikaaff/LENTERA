# Retrospective — 2026-11-13

## What worked

- **File-first.** PRD, glossary, ADRs, spec, tickets, and the living progress
  ledger meant the build never depended on chat memory.
- **Deep modules up front.** `reports` stayed pure, `inference` became the only
  Firebase AI surface, and `queue` the only Firestore surface. The boundary check
  caught nothing late because the shape was decided first.
- **Policy, not network sniffing.** Routing is a single visible table. The
  observability object makes "which path ran" a product fact, not a guess.
- **Prompt as code.** Versioned artifacts with a 12-case table and an automated
  token budget prevented the usual "looks good in the demo" drift.
- **Ponytail discipline.** No animation library, no state library, no map SDK, no
  Radix set for four screens. The whole UI is React + Tailwind + one CSS
  keyframe.

## What was cut

- Live model metrics. No Firebase project or Nano device in the session.
- Emulator rules tests. The rules mirror is unit-tested instead; the gap is
  named.
- Regency-level geometry. Province-level keeps the bundle at 336 KB and the map
  useful offline.
- Coordinator onboarding UI. Google sign-in exists; seeding
  `coordinators/{uid}.region` is an operator step.
- Cloud rate limiting. Documented as a public-traffic gap.
- PDF exports. Markdown is the deliverable; `markdown-to-pdf` was unavailable.

## What I would do differently

1. Get the Firebase project values and a Nano profile **before** F0. Half the
   acceptance gates depend on them.
2. Run `skill-crucible` on the dozen skills actually used, not all forty.
3. Start the emulator rules test at F3, when the rules are first written.
4. Add a single Playwright smoke test for capture → queue; the build verifies
   compilation, not the gesture chain.
5. Make `runTask` return a discriminated union per task so `photoDataUrl`
   narrowing does not need a cast.

## Grade against the definition of done

Code-level items (build, typecheck, tests, boundaries, rules mirror, schema
validation, offline queue, export, consent, masking) are done. Live-evidence
items (zero-request capture, cloud extraction, dedup confidence, SITREP source
links, Nano download) are implemented but **unverified** in this environment.
The README says so.
