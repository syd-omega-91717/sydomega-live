# SYD OMEGA 91717 -- mobile shell (Expo)

A thin WebView around the live site. It holds no data, keys or logic: sign-in,
approval and Row Level Security all stay in the web app and Supabase.

    cd mobile && npm install && npx expo start
    npm test        # navigation policy, plain node, no device needed

Set the target in `app.json` -> `expo.extra.siteUrl`. Navigation to any other
host opens in the system browser.

This folder is excluded from the web deploy (`scripts/vercel-build.sh`), so it
never ships to production. Nothing here is built or deployed by CI. A store
release needs EAS (`npx eas build`) and an Apple/Google developer account; both
stores may reject a bare WebView app, so add native value before submitting.

## What has and has not been tested

Tested (2026-11-01, Linux container, Node 22): clean `npm install`; the SDK 52
version check (`npx expo install --check`); `navigation.test.js` (28 assertions,
with a negative control); and `npx expo export --platform android --platform ios`,
which has Metro bundle the app to Hermes bytecode.

**Not tested: running on a device or simulator.** WebView loading, the Android
back button, the retry screen and real touch behaviour have never been seen.
`expo-doctor`'s network checks (config schema, React Native Directory) could not
reach `api.expo.dev` from the container.
