# T11 — Security rules and evidence

Status: done (rules + tests), unverified (deployed)
Blocked by: T06

## Outcome

Rules: volunteer creates/reads only reports at their own post, cannot edit a
synced report; coordinator reads region reports, may flag but not delete.
App Check debug provider in dev, reCAPTCHA Enterprise in production.

## Done when

- Rules unit tests prove cross-volunteer read denial.
- Secret scan is clean.
- Consent gate precedes any PII egress.
- Evidence document lists call sites and remaining deployment steps.
