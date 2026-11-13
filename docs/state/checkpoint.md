# Checkpoint

Updated: 2026-11-13 (session 3)

State: **DEPLOYED — CLOUD MEASURED — AUTH INITIALIZATION PENDING**

- Live URL: <https://lentera-6f2a-db3a1.web.app>
- Firebase project: `lentera-6f2a-db3a1` (number `1028167597621`).
- Firestore `(default)` is in `asia-southeast2`; rules and Hosting are released.
- 44 unit tests, 11 emulator rules tests, typecheck, boundaries, production
  build, browser walkthrough, and queued-report resume pass.
- 36/36 cloud extraction calls succeeded; schema valid 100%, field accuracy
  87.5% (21/24), avg 2,603 ms, p95 6,033 ms, all `in_cloud`.
  Evidence: `docs/prompts/cloud-metrics.json`.
- Live `/` and `/antrean` return 200; security headers are present. Screenshot:
  `docs/evidence/deploy-live.png`.

## Open blockers

1. **Anonymous Auth is not initialized.** Spark rejects the public
   `initializeAuth` call with `BILLING_NOT_ENABLED`, and client sign-in returns
   `CONFIGURATION_NOT_FOUND`. The owner must click Authentication → Get started
   → Anonymous in the Firebase console. Until then the live app is `TAMU` and a
   saved report cannot reach `terkirim`.
2. **No Nano-capable Chrome.** On-device path and A/B numbers are unmeasured.
3. **No App Check enforcement.** AI Logic answered without it; the reCAPTCHA
   Enterprise site key is still unset.
4. **SITREP artifacts unmeasured.** Only `report.extract.v1` has live cloud
   numbers.
5. **Prompt gaps found by measurement:** `missing-regency` returns `high`
   confidence instead of `low` (3/3), and `extreme-numbers` is accepted as a
   report (3/3).

## Exact next action

1. In the Firebase console for `lentera-6f2a-db3a1`, open **Authentication**,
   click **Get started**, enable **Anonymous**, and add the Hosting domain to
   authorized domains if it is not already listed.
2. On the live URL, verify sign-in leaves `TAMU`, save one report, and confirm
   `terkirim`. Record the screenshot.
3. Optionally enforce App Check (reCAPTCHA Enterprise) and seed
   `coordinators/{uid}`.
4. Fix the two prompt/validation gaps, then rerun
   `MEASURE_CONFIRM=1 MEASURE_PACE_MS=5000 npm run measure:cloud`.

## Resume protocol

Read `progress.md` first. Do not repeat a `[x]` task; verify its evidence instead.
A `[~]` task means the code exists but the live proof does not.
