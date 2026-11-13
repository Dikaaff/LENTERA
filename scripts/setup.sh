#!/usr/bin/env bash
# LENTERA setup wizard — steps only a human can perform.
set -euo pipefail

echo "LENTERA setup"
echo "1. Install dependencies"
npm install

echo "2. Firebase web app config"
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "   Fill .env.local from Firebase console > Project settings > Your apps."
  echo "   Then re-run this script."
  exit 0
fi
grep -q "VITE_FIREBASE_PROJECT_ID=." .env.local || {
  echo "   .env.local is missing VITE_FIREBASE_PROJECT_ID. Fill it first."
  exit 1
}

echo "3. Firebase login and project selection"
npx firebase login
echo "   Run: npx firebase use <project-id>"
echo "   Enable Firestore, Authentication (Anonymous + Google), and AI Logic."

echo "4. App Check debug provider"
echo "   Set VITE_APP_CHECK_DEBUG=1 for local development."
echo "   Start the app, copy the debug token from the browser console,"
echo "   then register it at Security > App Check > Apps > Manage debug tokens."
echo "   Never commit the token."

echo "5. Chrome on-device model (optional bonus path)"
echo "   - Chrome Desktop 139+"
echo "   - chrome://flags/#prompt-api-for-gemini-nano-multimodal-input -> Enabled"
echo "   - DevTools console: await LanguageModel.availability()"
echo "   - If 'downloadable': await LanguageModel.create() (~4 GB, unmetered)"
echo "   The app works without this; cloud is the default fallback."

echo "6. Verify"
npm run check
echo "Done. Start with: npm run dev"
