#!/usr/bin/env bash
# Guarded production deploy. Nothing runs against a real project by accident.
set -euo pipefail

PROJECT="${FIREBASE_PROJECT:-}"
ENV_PROJECT=$(grep -E '^VITE_FIREBASE_PROJECT_ID=' .env.local 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r' || true)
if [ -z "$PROJECT" ]; then
  PROJECT="$ENV_PROJECT"
fi

if [ -z "$PROJECT" ] || [ "$PROJECT" = "lentera-demo" ]; then
  echo "Refusing deploy: set FIREBASE_PROJECT to a real project id."
  echo "Example: FIREBASE_PROJECT=lentera-prod bash scripts/deploy.sh"
  exit 2
fi

if [ -z "$ENV_PROJECT" ]; then
  echo "Refusing deploy: .env.local has no VITE_FIREBASE_PROJECT_ID; the build would be local-only."
  exit 2
fi
if [ "$ENV_PROJECT" != "$PROJECT" ]; then
  echo "Refusing deploy: .env.local targets $ENV_PROJECT but FIREBASE_PROJECT is $PROJECT."
  exit 2
fi
if grep -qE '^VITE_USE_EMULATORS=1' .env.local || grep -qE '^VITE_DISABLE_AI=1' .env.local; then
  echo "Refusing deploy: .env.local still has emulator/AI-disabled flags."
  exit 2
fi

if [ -f ".tools/jre/jdk-21.0.13+9-jre/bin/java.exe" ]; then
  export JAVA_HOME="$PWD/.tools/jre/jdk-21.0.13+9-jre"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "==> preflight: typecheck, unit tests, boundaries"
npm run check

echo "==> preflight: Firestore rules against the emulator"
npm run test:rules

echo "==> preflight: production build"
npm run build

echo "==> deploy rules + hosting to $PROJECT"
npx firebase deploy --only firestore:rules,hosting --project "$PROJECT"

echo "==> deployed"
echo "Hosting: https://$PROJECT.web.app"
echo "Rules:   https://console.firebase.google.com/project/$PROJECT/firestore/rules"
