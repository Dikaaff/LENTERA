# Assumptions and substitutions

Date: 2026-11-13.

## Environment

1. **No Firebase project config.** `VITE_FIREBASE_*` values were not provided.
   The app runs in local-only mode: queue and manual entry work; AI and sync
   report themselves unavailable. No cloud call was executed or claimed.
2. **No Nano-capable Chrome.** On-device inference could not be run. All local
   path findings are documented as unexecuted in
   `docs/research/local-language-findings.md`.
3. **GitHub CLI is not authenticated, but git push works** through a cached
   credential. Both commits reached `Dikaaff/LENTERA`; see `progress.md`.
4. **Windows + Git Bash.** Commands use POSIX syntax; no PowerShell.

## Skill substitutions

Installed and used: `setup-matt-pocock-skills` (repo layout manual), `research`,
`domain-modeling`, `codebase-design`, `to-spec`, `to-tickets`, `writing-for-agents`,
`wizard`, `setup-pre-commit`, `git-guardrails-claude-code`, `prototype` (design
reasoning, no throwaway harness run), `tdd`, `diagnosing-bugs`, `impeccable`
(design rules applied), `brandkit`, `logo-generator`, `frontend-design`,
`hackathon-guide`, `skill-crucible` (not executed), `retro`, `pr`, `ponytail`,
`caveman`.

Unavailable from the registry at build time, replaced manually:
`full-output-enforcement`, `customize-opencode`, `design-taste-frontend`,
`design-taste-frontend-v2-experimental`, `high-end-visual-design`,
`stitch-design-taste`, `minimalist-ui`, `industrial-brutalist-ui`,
`markdown-to-pdf`.

Consequences:

- Files were written complete, in one pass, instead of via
  `full-output-enforcement`.
- Design rules were applied directly from the brief and `impeccable`; no
  generated `stitch` artifact exists.
- PDFs of README/script were not produced; Markdown is the deliverable.

## Technical substitutions

1. **shadcn CLI not run.** `components.json` was not generated; button, card,
   badge, and field primitives were hand-authored in the shadcn pattern
   (`cva` + `cn` + token classes). This avoids a network-interactive init and
   Radix dependencies that the four screens do not need.
2. **Magic UI patterns implemented locally.** `NumberTicker` uses
   `requestAnimationFrame`; `BlurFade` uses one CSS keyframe. No animation
   dependency was added.
3. **Province geometry, not regency geometry.** A 336 KB province GeoJSON
   (`superpikar/indonesia-geojson`, accessed 2026-11-13) is bundled. Regency
   geometry would be tens of megabytes. ADR-003 records the tradeoff.
4. **On-device temperature is not configurable.** Firebase JS SDK v13 only
   exposes `temperature` in `inCloudParams.generationConfig`. The prompt carries
   determinism instructions instead.
5. **Rules are now proven twice.** A pure mirror is unit-tested, and 11 real
   Firestore emulator tests run with a project-local JRE 21. The JRE and
   emulator cache live in `.tools/` and the user profile cache, both untracked.
6. **Skill audit scores are absent.** `skill-crucible` was not executed against
   40 skill folders. No third-party skill script was allowed near
   `firestore.rules`, auth, or secrets; those were written and reviewed directly.
7. **No live A/B metric.** See `docs/prompts/metrics.md`; numbers are blank by
   design rather than fabricated.
8. **E2E runs with AI disabled.** `VITE_DISABLE_AI=1` exercises the manual
   fallback and the queue/sync path without a model. It is not a model test and
   is labelled as such in the README.
