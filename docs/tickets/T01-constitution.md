# T01 — Constitution, boundaries, guardrails

Status: done
Blocked by: none

## Outcome

`AGENTS.md` encodes the AI/offline rules. dependency-cruiser fails the build if
`reports` imports Firebase, if anything outside `inference` imports
`firebase/ai`, or if anything outside `queue` imports `firebase/firestore`.

## Demoable alone

`npm run boundaries` exits 0 on a clean tree and fails on a deliberate violation.
