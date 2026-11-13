# Deploy

Status: **deployed** on 2026-11-13 to Firebase project
`lentera-6f2a-db3a1` (number `1028167597621`).

- Live URL: <https://lentera-6f2a-db3a1.web.app>
- `bash scripts/deploy.sh lentera-6f2a-db3a1` exited 0; Firestore rules and
  Hosting were released.
- `/` and `/antrean` returned HTTP 200. The SPA rewrite works on real Hosting.
- Security headers were observed on the live domain: `X-Content-Type-Options:
nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self),
microphone=(), geolocation=()`, and HSTS.
- The live bundle contains project `lentera-6f2a-db3a1`; the screenshot is
  `docs/evidence/deploy-live.png`.
- Firestore `(default)` is in `asia-southeast2`.

Not active yet: **Authentication**. The Spark project still returns
`CONFIGURATION_NOT_FOUND` for anonymous sign-in, so the live app renders as
`TAMU` and a saved report cannot sync. Authentication → Get started must be
clicked in the console; the public `initializeAuth` API requires billing.

Everything below remains the operating procedure.

## What is already prepared

- `firebase.json`: Hosting serves `dist`, rewrites every route to `index.html`,
  sets immutable caching for hashed assets, and adds `nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy` headers.
  The rewrite was verified locally and live (`/antrean` → 200 + SPA shell), and
  all custom headers were observed on the deployed domain.
- `firestore.rules`: 11 emulator tests pass.
- `scripts/deploy.sh`: refuses `lentera-demo`, runs typecheck, unit tests,
  boundaries, rules tests, and the production build before deploying.
- `.env.emulator` is only for local verification and is never used by a
  production build.

## 1. Project and login

```bash
npx firebase login
npx firebase projects:list
```

Use an existing project or create one in the console. Then:

```bash
npx firebase use --add   # select the project and name the alias
```

## 2. Enable the services

In the Firebase console for that project:

1. **Firestore** — create a database in production mode.
2. **Authentication** — enable Anonymous and Google providers.
3. **AI Logic** — enable the Gemini Developer API backend.
4. **App Check** — register the web app with reCAPTCHA Enterprise.
5. **Hosting** — no setup needed; the first deploy creates the site.

## 3. Web app config

Create `.env.local` from `.env.example` and fill the real values:

```bash
cp .env.example .env.local
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_PROJECT_ID=...
# VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=...
# do NOT set VITE_USE_EMULATORS or VITE_DISABLE_AI
```

Vite bakes these values into the build, so the production build must be made
with this file present.

## 4. Preflight and deploy

```bash
bash scripts/deploy.sh <project-id>
# or: FIREBASE_PROJECT=<project-id> bash scripts/deploy.sh
```

From PowerShell, pass the id as an argument; PowerShell does not understand the
`VAR=value command` prefix:

```powershell
bash scripts/deploy.sh <project-id>
```

The script runs, in order:

1. `npm run check`
2. `npm run test:rules` (uses the local JRE if present)
3. `npm run build`
4. `firebase deploy --only firestore:rules,hosting`

It exits before deploying if the project is empty or `lentera-demo`.

## 5. Post-deploy

1. Seed one coordinator document per region:
   `coordinators/{uid} = { region: "Aceh" }`.
   The Google account must have `email_verified == true`.
2. Open the Hosting URL, enable Anonymous in the console (see above), then save
   one report.
3. Confirm the badge reaches `terkirim`. This is **not yet verified live**
   because Auth is inactive.
4. Register the App Check debug token for local development, then enforce App
   Check for AI Logic and Firestore.
5. Rerun `MEASURE_CONFIRM=1 MEASURE_PACE_MS=5000 npm run measure:cloud` after
   prompt changes; the current numbers are in `docs/prompts/metrics.md`.

## Rollback

- Hosting: **Hosting → Release history → Rollback**.
- Rules: deploy the previous `firestore.rules` with the same command.

## Earlier blocked attempt

The first attempt, before the project existed, returned
`Error: Failed to authenticate, have you run firebase login?`; the exact output
is kept in `docs/evidence/deploy-blocked.txt`. After `npx firebase login`, the
project was created and the deploy above succeeded.
