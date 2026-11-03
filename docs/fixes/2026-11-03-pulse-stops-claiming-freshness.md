### Pulse: the UPDATED time, LIVE badge, missing currencies and missing changes no longer assert data the page does not have (2026-11-03)

**Why.** Reading `pulse.html` (the market page that pulls CoinGecko and open.er-api) for how it behaves when a source fails, four places stated something the page did not know. Each was reproduced on the unmodified file in headless Chromium with the sources blocked or edited:
1. `refresh()` wrote "UPDATED hh:mm:ss" and the top-bar time before fetching, so a total outage still printed `08:46:51`.
2. `rates[item.code]||1` drew any currency the API omitted as a rate: `USD/CHF 1.0000`.
3. `price_change_percentage_24h||0` (twice: the coin cards and the market-cap list) drew a missing change as a flat `+0.00%`, green.
4. The top bar's green pulsing `LIVE` was static markup, on during an outage. The crypto error text also named "CoinGecko rate limit" whatever the cause.

**Fix.** `fetchCrypto`/`fetchForex` return true/false and reject empty responses; the time is stamped only after at least one of them answered; the badge reads CONNECTING, then LIVE or STALE; a missing currency prints `—`, a missing change prints `--` in a neutral colour; the error text states the actual error and is shown only when nothing was ever loaded (older data stays on screen and the unchanged time shows its age).

**Verified.** Chromium via the harness, three cases. Outage: UPDATED `--`, badge STALE, error text with the real cause, 0 page errors. Normal response: timestamp set, LIVE. Response without CHF and with a null change: `USD/CHF —`, `-- 24h`. The unmodified page under the same conditions: outage still stamped a time, `USD/CHF1.0000`. `scripts/tests/test_pulse_truth.py` (6 tests) fails 6/6 on the old file, passes on the new.

**Not done / not verified.** This session's network policy blocks coingecko, open-meteo, open.er-api and opentdb, so no live response was fetched; the three cases use stubbed responses. Whether the real APIs still return the shapes this page expects is unverified. The `fx-bar` width is a fixed 100% (decorative, conveys nothing) and was left. Gold, oil and index prices come from the `market-price` Edge Function and already show `UNAVAILABLE` when absent; not changed. Weather and news were not audited.
