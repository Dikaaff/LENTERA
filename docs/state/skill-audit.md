# Skill audit

Date: 2026-11-13.

`skill-crucible` was **not executed** in this session. No numeric 0–100 scores
exist, and inventing them would violate the evidence rule. Consequence: no
third-party skill was allowed to author or run code touching
`firestore.rules`, authentication, or secrets. Those were written directly and
reviewed in-repo.

| Skill                      | Source                  | Used for                                | Trust note                   |
| -------------------------- | ----------------------- | --------------------------------------- | ---------------------------- |
| ponytail                   | dietrichgebert/ponytail | smallest complete change, no extra deps | instructions only            |
| caveman                    | juliusbrussee/caveman   | terse status reporting                  | instructions only            |
| setup-matt-pocock-skills   | mattpocock/skills       | repo doc/ticket layout                  | applied manually             |
| research                   | mattpocock/skills       | primary-source notes                    | verified URLs                |
| domain-modeling            | mattpocock/skills       | glossary + ADR shape                    | applied                      |
| codebase-design            | mattpocock/skills       | deep-module boundaries                  | enforced by depcruise        |
| to-spec / to-tickets       | mattpocock/skills       | spec + tracer tickets                   | applied                      |
| writing-for-agents         | mattpocock/skills       | AGENTS.md                               | applied                      |
| wizard                     | mattpocock/skills       | scripts/setup.sh                        | applied                      |
| setup-pre-commit           | mattpocock/skills       | Husky + lint-staged                     | applied                      |
| git-guardrails-claude-code | mattpocock/skills       | destructive-command rules               | documented in AGENTS.md      |
| tdd                        | mattpocock/skills       | tests before wiring UI                  | 44 tests                     |
| prototype                  | mattpocock/skills       | mode-behavior reasoning                 | no harness run (no Firebase) |
| diagnosing-bugs            | mattpocock/skills       | test failure root causes                | used during test repair      |
| impeccable                 | preloaded               | design critique rules                   | applied to UI                |
| brandkit / logo-generator  | preloaded               | palette + mark construction             | applied                      |
| frontend-design            | preloaded               | visual direction                        | applied                      |
| hackathon-guide            | preloaded               | submission checklist                    | applied                      |
| retro                      | mattpocock/skills       | close-out                               | applied                      |
| pr                         | mattpocock/skills       | repo summary                            | applied                      |

Skills installed but not materially used: `academic-*`, `deep-research`
(via direct docs reads), `caption-animation`, `countdown-video`, `logo-*` used,
`lower-thirds`, `short-form-video`, `learn-anything`, `migrate-to-shoehorn`,
`scaffold-exercises`, `reverse-engineer-anything`, `perfect-web-clone`,
`portfolio-*`, `imagegen-*`, `aceternity-ui`, `shadcn` (pattern applied, CLI not
run), `magic-ui` (patterns implemented), `find-skills`.

## Gate decision

Because audit scores are missing, the repo treats every third-party skill as
untrusted prose. None is imported at runtime. `npm run boundaries` ensures no
skill artifact can reach Firebase or the schema.
