# Checkpoint

Updated: 2026-11-13 (session 2)

State: **CODE COMPLETE — CLOUD + DEPLOY BLOCKED ON CREDENTIALS**

- Current phase: F12 reached. F6 (queue/sync) and F9 (security rules) are now
  verified against Auth + Firestore emulators. F5/F7 still carry a `~` because
  no Firebase AI project or Nano device was available.
- Completed: all 13 phases as artifacts and code. 44 unit tests, 11 emulator
  rules tests, two browser walkthroughs (including queued-report resume),
  hosting SPA rewrite, typecheck, boundary check, and production build pass.
- Skills used: see `docs/state/skill-audit.md`. `skill-crucible` scores are
  absent; no third-party skill script touched rules/auth/secrets.
- Open blockers:
  1. No Firebase login or real project id → cloud measurement and deploy are
     blocked. The cloud harness exits 2 instead of guessing.
  2. No Chrome 139+ Nano profile → on-device path unexecuted.
  3. No deployed project → reCAPTCHA Enterprise, hosting headers, and live
     conflict behavior across two devices remain unverified.
- Repository: pushed to `Dikaaff/LENTERA`; headless Chrome boot check passed.
- Verified end-to-end locally: capture → consent → manual fallback → save →
  Firestore emulator sync (`terkirim`) → reload → map, plus a queued report
  resumed after reload.
- Exact next action:
  1. Owner runs `npx firebase login` and supplies the real project id.
  2. Fill real `VITE_FIREBASE_*`, remove the emulator flags, register App Check.
  3. Run `MEASURE_CONFIRM=1 npm run measure:cloud` and fill metrics.
  4. Run `FIREBASE_PROJECT=<id> bash scripts/deploy.sh`, then seed coordinators
     and enforce App Check.

## Resume protocol

Read `progress.md` first. Do not repeat a `[x]` task; verify its evidence instead.
A `[~]` task means the code exists but the live proof does not.
