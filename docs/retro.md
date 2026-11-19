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
- **Emulator-first verification.** Installing a project-local JRE and running
  Auth + Firestore emulators turned two "pending" claims into real evidence and
  exposed a sync bug that no unit test would have caught.

## What was cut

- Local (Nano) model metrics. No Nano-capable device in the session. Cloud
  extraction was measured after the project was attached: 36/36 calls, 87.5%
  field accuracy. Dedup and SITREP narrative remain unmeasured.
- Nothing from the data layer was cut: the emulator suite covers rules and sync.
- Regency-level geometry. Province-level keeps the bundle at ~198 KB and the map
  useful offline.
- Coordinator onboarding UI. Google sign-in exists; seeding
  `coordinators/{uid}.region` is an operator step.
- Cloud rate limiting. Documented as a public-traffic gap.
- PDF exports. Markdown is the deliverable; `markdown-to-pdf` was unavailable.

## What I would do differently

1. Get the Firebase project values and a Nano profile **before** F0. Half the
   acceptance gates depend on them.
2. Run `skill-crucible` on the dozen skills actually used, not all forty.
3. Start the emulator rules test at F3, when the rules are first written. This
   session did it late and then found the sync metadata bug immediately.
4. Prefer `includeMetadataChanges: true` in any Firestore status listener from
   the start; the default silently hides the cache→server transition.
5. Make `runTask` return a discriminated union per task so `photoDataUrl`
   narrowing does not need a cast.

## Grade against the definition of done

Code-level items (build, typecheck, tests, boundaries, schema validation,
offline queue, export, consent, masking) are done. Data and rules are verified
end-to-end against the emulator, including cross-volunteer denial. Cloud
extraction is measured (36/36, 87.5% field accuracy) and rules + Hosting are
deployed; anonymous Auth and a live save through `terkirim` are verified. Still
**unverified**: local extraction, dedup confidence, SITREP narrative,
zero-request Network proof, and Nano download, because no Nano-capable device
exists in this environment. The README says so.
