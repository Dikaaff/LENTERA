# AGENTS.md — LENTERA constitution

Read this before any change. It is the short version of the non-negotiables.

## Product

LENTERA turns free-form Indonesian field notes (plus one optional JPEG/PNG) into
validated structured reports on-device, queues them offline, syncs them to
Firestore, and produces a cloud daily SITREP. Tagline: "Field reports that
survive when the network does not."

## Non-negotiables

1. **Firebase AI Logic is the only AI runtime.** No direct Gemini SDK, OpenAI,
   Ollama, WebLLM, or fetch to a model endpoint. Import and call `firebase/ai`.
2. **Only `src/modules/inference` may import `firebase/ai`.**
3. **Only `src/modules/queue` may import `firebase/firestore`.**
4. **`src/modules/reports` is pure.** No Firebase, no React, no DOM.
5. **Model output is untrusted.** Validate with Zod before UI or persistence.
   On failure retry once in cloud; if cloud is unavailable keep the local result
   with `needs_review: true`.
6. **Offline is visible.** Never hide a failed write or an absent model behind a
   spinner. The user sees `menunggu`, `terkirim`, `perlu ditinjau`, or `konflik`.
7. **Consent before cloud egress.** First cloud escalation shows the consent
   panel; refusal keeps the local path available.
8. **PII masking before escalation.** Reporter names and phone numbers become
   tokens; the token map stays local. Victim and casualty data are product data
   and are not masked.
9. **No chat on the on-device path.** Single-turn, button-triggered tasks only.
10. **App Check is mandatory.** Debug provider in dev (never commit the token),
    reCAPTCHA Enterprise in production.
11. **No Dart/Flutter/React Native.** This is a web PWA: Vite + React +
    TypeScript strict + Tailwind + shadcn-style primitives.
12. **No new dependency** without a one-line justification and user approval.

## Code rules

- No placeholders, `TODO`, `any`, or dead code.
- Functions ≤ 40 lines, files ≤ 200 lines, one reason to change per module.
- All human-facing copy in Indonesian. JSON keys and enum values in English.
- Numerals use tabular figures. Touch targets ≥ 44 px. Dark surface by default.
- Comments explain why, in one line. Do not comment what the code says.
- All colors come from tokens in `src/index.css` / `docs/brand.md`.
- Forbidden: gradients, glassmorphism, emoji icons, lorem ipsum, decorative
  animation, uniform rounding, stock people illustrations.

## Commands

```bash
npm run dev         # local app
npm run typecheck   # tsc -b
npm run test        # vitest unit tests (43)
npm run test:rules  # Firestore emulator rules tests (11, needs Java 17+)
npm run measure:cloud  # real cloud metrics; needs MEASURE_CONFIRM=1 + real config
FIREBASE_PROJECT=<id> bash scripts/deploy.sh  # guarded deploy
npm run boundaries  # dependency-cruiser
npm run build       # production build
npm run check       # typecheck + test + boundaries
git status          # .env.local and .tools/ must stay untracked
```

## Module map

```
src/modules/reports     schema, types, status, masking (pure)
src/modules/inference   ONLY firebase/ai; runTask entry point, prompts, policy
src/modules/queue       ONLY firebase/firestore; local-first store, hook, export
src/modules/sitrep      consent, cluster + daily tasks, claim parsing
src/modules/map         bundled geojson, projection, aggregation
src/modules/auth        Firebase Auth roles
src/screens             four screens
src/components/ui       shadcn-style primitives
```

## Definition of done for a change

`npm run check` passes, the behavior is exercised by a test or a real command,
and the new state is written to `progress.md`.
