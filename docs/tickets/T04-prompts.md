# T04 — Prompt artifacts and adversarial suite

Status: done
Blocked by: T02, T03

## Outcome

Three versioned TypeScript artifacts: `report.extract.v1`, `sitrep.cluster.v1`,
`sitrep.daily.v1`. Each has intent, model params, system prompt, user template
with named variables, test table, metrics, limitations, changelog.

## Done when

- Injection defense string is present verbatim in the extraction system prompt.
- Token budget test asserts ≤ 2,600 estimated tokens.
- Four adversarial fixtures exist: fake instruction, empty, mixed language,
  extreme numbers.
- Prompt suite passes deterministic schema checks.
