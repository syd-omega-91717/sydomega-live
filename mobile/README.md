# SYD OMEGA 91717 -- mobile shell (Expo)

A thin WebView around the live site. It holds no data, keys or logic: sign-in,
approval and Row Level Security all stay in the web app and Supabase.

    cd mobile && npm install && npx expo start

Set the target in `app.json` -> `expo.extra.siteUrl`. Navigation to any other
host opens in the system browser.

This folder is excluded from the web deploy (`scripts/vercel-build.sh`), so it
never ships to production. Nothing here is built or deployed by CI. A store
release needs EAS (`npx eas build`) and an Apple/Google developer account; both
stores may reject a bare WebView app, so add native value before submitting.
