# Checkpoint

Updated: 2026-11-13 (session 3)

State: **DEPLOYED — CLOUD MEASURED — LIVE SAVE VERIFIED**

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
- Anonymous Auth is active. Headless Chrome on the live URL signed in as
  `RELAWAN`, saved a report, saw `TERKIRIM` with `DITAHAN 0`, and the report
  survived a reload. Evidence: `docs/evidence/live-terkirim.png`.

## Open blockers

1. **No Nano-capable Chrome.** On-device path and A/B numbers are unmeasured.
   The live save used the manual fallback (`JALUR: MANUAL`).
2. **No App Check enforcement.** AI Logic answered without it; the reCAPTCHA
   Enterprise site key is still unset.
3. **SITREP artifacts unmeasured.** Only `report.extract.v1` has live cloud
   numbers.
4. **Prompt gaps found by measurement:** `missing-regency` returns `high`
   confidence instead of `low` (3/3), and `extreme-numbers` is accepted as a
   report (3/3).
5. **Coordinator docs are not seeded.** Needs a Google-signed-in uid.

## Exact next action

1. Optionally enforce App Check (reCAPTCHA Enterprise) and seed
   `coordinators/{uid}` with a region.
2. Fix the two prompt/validation gaps, then rerun
   `MEASURE_CONFIRM=1 MEASURE_PACE_MS=5000 npm run measure:cloud`.
3. Measure `sitrep.cluster.v1` and `sitrep.daily.v1`.
4. Repeat the extraction path on Chrome 139+ with Nano and record local
   latency/source.

## Session 4 add-on (admin + modern UI)

- AdminScreen (`/admin`) tersedia untuk koordinator: daftar 5 uji kasus,
  tombol tinjau hasil cluster + SITREP.
- Shell diperbarui: ikon dalam header, menu profil kanan, badge peran,
  layar terkunci untuk tamu.
- TSc full lambat; pemeriksaan transpile cepat OK untuk App.tsx + AdminScreen.

## Resume protocol

Read `progress.md` first. Do not repeat a `[x]` task; verify its evidence instead.
A `[~]` task means the code exists but the live proof does not.
