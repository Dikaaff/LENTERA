# Deploy

Status: **not deployed**. No Firebase login and no real project id were available
to the build session. Everything below is prepared and locally verified; the
last step needs the project owner.

## What is already prepared

- `firebase.json`: Hosting serves `dist`, rewrites every route to `index.html`,
  sets immutable caching for hashed assets, and adds `nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy` headers.
  The rewrite was verified locally (`/antrean` → 200 + SPA shell). The emulator
  does not emit the custom headers, so those are configuration-only until the
  first real deploy.
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
FIREBASE_PROJECT=<project-id> bash scripts/deploy.sh
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
2. Open the Hosting URL, allow anonymous sign-in, and save one report.
3. Confirm the badge reaches `terkirim`.
4. Register the App Check debug token for local development, then enforce App
   Check for AI Logic and Firestore.
5. Run `MEASURE_CONFIRM=1 npm run measure:cloud` against a dev server built
   with real config, then paste the numbers into `docs/prompts/metrics.md`.

## Rollback

- Hosting: **Hosting → Release history → Rollback**.
- Rules: deploy the previous `firestore.rules` with the same command.

## Why this was not executed here

`firebase deploy` (and `firebase projects:list`) returns:

```
Error: Failed to authenticate, have you run firebase login?
```

The exact output is in `docs/evidence/deploy-blocked.txt`.

No `FIREBASE_TOKEN`, project id, or Gemini key exists in the environment. A
deploy without them would be a false claim, so it was not attempted against a
real project. See `docs/evidence/deploy-blocked.txt`.
