/* ============================================================================
   Ω SYD OMEGA 91717 — omega-chronometer.js

   Two chronometers. Neither one measures time in the browser.

     1. APPROVAL WINDOW — 9m17s (557s). Starts when the member confirms their
        approval, not when the owner grants it. A member approved overnight
        does not lose the window while asleep.

     2. DAILY ENGAGEMENT — 9h17m17s (33,437s) per day. Accrues while present.
        Pauses on sign-out, hidden tab, and idle. Resumes on return.

   ----------------------------------------------------------------------------
   THE CLIENT NEVER REPORTS A DURATION
   ----------------------------------------------------------------------------
   It sends a heartbeat meaning "I am here right now". The server measures the
   gap against its own clock and credits at most 45 seconds per beat. Everything
   below is display and presence detection — the numbers shown always come back
   from engagement_heartbeat() / get_engagement_status().

   This matters because 33,437s is 38.7% of every day with rewards attached.
   Any clock the browser owns is a clock a member can set.

   Requires migrations/0006_chronometers.sql.
   Registered in bg.js, so it runs on every page.

   Console helpers:
       OmegaChrono.status()   -> current server-side figures
       OmegaChrono.pause()    -> force pause
       OmegaChrono.resume()   -> force resume
   ============================================================================ */

(function () {
  "use strict";
  if (window.OmegaChrono) return;

  var SUPABASE_URL = "https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var SUPABASE_KEY = "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";

  var BEAT_MS      = 30000;   // must stay under the server's 45s cap
  var IDLE_MS      = 120000;  // 2 min without input = not surfing
  var TICK_MS      = 1000;    // display refresh only

  var st = {
    sb: null,
    running: false,
    paused: false,
    lastActivity: Date.now(),
    beatTimer: null,
    tickTimer: null,
    accrued: 0,          // last server figure
    target: 33437,
    completed: false,
    trialExpiresAt: null,
    trialTimer: null
  };

  /* ------------------------------------------------------------------ utils */
  function hms(total) {
    total = Math.max(0, Math.floor(total));
    var h = Math.floor(total / 3600),
        m = Math.floor((total % 3600) / 60),
        s = total % 60;
    return (h > 0 ? h + "h " : "") +
           (h > 0 || m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + "m " : "") +
           (s < 10 && (h > 0 || m > 0) ? "0" : "") + s + "s";
  }

  function getClient() {
    if (st.sb) return Promise.resolve(st.sb);
    var p = (window.OmegaSB && typeof window.OmegaSB.get === "function")
      ? Promise.resolve(window.OmegaSB.get())
      : import("https://esm.sh/@supabase/supabase-js@2").then(function (m) {
          return m.createClient(SUPABASE_URL, SUPABASE_KEY);
        });
    return p.then(function (c) { st.sb = c; return c; });
  }

  /* ------------------------------------------------------------------- style */
  var CSS = [
    "#omg-chrono{position:fixed;right:14px;bottom:14px;z-index:9990;",
    "font-family:'Rajdhani',system-ui,sans-serif;background:rgba(10,10,15,.92);",
    "border:1px solid rgba(201,168,76,.35);border-radius:10px;padding:9px 13px;",
    "color:#C9A84C;font-size:12px;letter-spacing:.5px;min-width:190px;",
    "box-shadow:0 6px 24px rgba(0,0,0,.45);backdrop-filter:blur(6px)}",
    "#omg-chrono .lbl{opacity:.6;font-size:10px;letter-spacing:1.4px;text-transform:uppercase}",
    "#omg-chrono .val{font-size:16px;font-variant-numeric:tabular-nums;margin-top:2px}",
    "#omg-chrono .bar{height:3px;background:rgba(201,168,76,.18);border-radius:2px;",
    "margin-top:7px;overflow:hidden}",
    "#omg-chrono .bar i{display:block;height:100%;background:#C9A84C;width:0;",
    "transition:width .6s ease}",
    "#omg-chrono .state{margin-top:5px;font-size:10px;opacity:.55;letter-spacing:1px}",
    "#omg-chrono.paused{border-color:rgba(140,140,140,.3);color:#8a8a8a}",
    "#omg-chrono.paused .bar i{background:#6a6a6a}",
    "#omg-chrono.done{border-color:rgba(90,200,120,.5);color:#7ad39a}",
    "#omg-chrono.done .bar i{background:#7ad39a}",
    "#omg-trial{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:9991;",
    "font-family:'Rajdhani',system-ui,sans-serif;background:rgba(30,10,10,.94);",
    "border:1px solid rgba(220,90,90,.5);border-radius:10px;padding:9px 18px;",
    "color:#e88;font-size:13px;letter-spacing:1px;text-align:center;",
    "box-shadow:0 6px 24px rgba(0,0,0,.5)}",
    "#omg-trial b{font-size:18px;font-variant-numeric:tabular-nums;color:#ffb4b4}",
    "@media(max-width:640px){#omg-chrono{left:10px;right:10px;bottom:10px;min-width:0}}",
    "@media(prefers-reduced-motion:reduce){#omg-chrono .bar i{transition:none}}"
  ].join("");

  function css() {
    if (document.getElementById("omg-chrono-css")) return;
    var s = document.createElement("style");
    s.id = "omg-chrono-css";
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ------------------------------------------------------------- daily panel */
  function panel() {
    var el = document.getElementById("omg-chrono");
    if (el) return el;
    if (!document.body) return null;
    css();
    el = document.createElement("div");
    el.id = "omg-chrono";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "off");   // updates every second; do not announce
    el.innerHTML =
      '<div class="lbl">Daily presence</div>' +
      '<div class="val" id="omg-chrono-val">--</div>' +
      '<div class="bar"><i id="omg-chrono-bar"></i></div>' +
      '<div class="state" id="omg-chrono-state"></div>';
    document.body.appendChild(el);
    return el;
  }

  function paint() {
    var el = panel();
    if (!el) return;
    var remaining = Math.max(0, st.target - st.accrued);

    document.getElementById("omg-chrono-val").textContent =
      st.completed ? "Complete" : hms(remaining) + " left";
    document.getElementById("omg-chrono-bar").style.width =
      Math.min(100, (st.accrued / st.target) * 100) + "%";

    var state = st.completed ? "Today's obligation met"
              : st.paused   ? "Paused — not surfing"
              : "Counting";
    document.getElementById("omg-chrono-state").textContent =
      state + "  ·  " + hms(st.accrued) + " of " + hms(st.target);

    el.className = st.completed ? "done" : (st.paused ? "paused" : "");
  }

  /* Local ticking is DISPLAY ONLY — it makes the number move between beats.
     Every 30s the server figure overwrites it, so drift never accumulates. */
  function tick() {
    if (st.running && !st.paused && !st.completed) {
      st.accrued = Math.min(st.target, st.accrued + 1);
    }
    paint();
  }

  function beat() {
    if (!st.running || st.paused) return;
    getClient().then(function (sb) {
      return sb.rpc("engagement_heartbeat").then(function (r) {
        if (r.error) {
          if (/does not exist|schema cache/i.test(r.error.message || "")) {
            console.warn("[OmegaChrono] engagement_heartbeat missing — apply " +
                         "migrations/0006_chronometers.sql. Stopping.");
            stop();
          } else {
            console.warn("[OmegaChrono] heartbeat failed", r.error);
          }
          return;
        }
        var d = Array.isArray(r.data) ? r.data[0] : r.data;
        if (!d) return;
        st.accrued   = d.seconds_accumulated;
        st.target    = d.seconds_target;
        st.completed = d.completed;
        paint();
      });
    }).catch(function (e) { console.warn("[OmegaChrono] heartbeat error", e); });
  }

  function pause(reason) {
    if (st.paused) return;
    st.paused = true;
    paint();
    getClient().then(function (sb) { return sb.rpc("engagement_pause"); })
      .catch(function () {});
    console.info("[OmegaChrono] paused —", reason || "unspecified");
  }

  function resume(reason) {
    if (!st.paused) return;
    st.paused = false;
    st.lastActivity = Date.now();
    paint();
    beat();   // re-anchor immediately; this beat credits nothing by design
    console.info("[OmegaChrono] resumed —", reason || "activity");
  }

  function stop() {
    st.running = false;
    clearInterval(st.beatTimer);
    clearInterval(st.tickTimer);
    var el = document.getElementById("omg-chrono");
    if (el) el.remove();
  }

  /* --------------------------------------------------- presence detection */
  function watchPresence() {
    var events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart",
                  "pointerdown", "wheel"];
    var throttled = false;
    events.forEach(function (ev) {
      window.addEventListener(ev, function () {
        st.lastActivity = Date.now();
        if (st.paused) resume("activity");
        if (throttled) return;
        throttled = true;
        setTimeout(function () { throttled = false; }, 1000);
      }, { passive: true });
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause("tab hidden");
      else resume("tab visible");
    });

    window.addEventListener("blur",  function () { pause("window blurred"); });
    window.addEventListener("focus", function () { resume("window focused"); });

    // Idle sweep: no input for IDLE_MS means the member is not surfing.
    setInterval(function () {
      if (!st.running || st.paused) return;
      if (Date.now() - st.lastActivity > IDLE_MS) pause("idle");
    }, 10000);

    // Best-effort pause on leaving. sendBeacon is not available for an RPC
    // with auth headers, so this is opportunistic — the server's 45s cap means
    // a missed pause costs at most one beat's worth of credit.
    window.addEventListener("pagehide", function () { pause("page hidden"); });
  }

  /* ------------------------------------------------- approval countdown UI */
  function trialBanner(secondsRemaining) {
    var el = document.getElementById("omg-trial");
    if (secondsRemaining <= 0) {
      if (el) el.remove();
      clearInterval(st.trialTimer);
      console.info("[OmegaChrono] approval window ended — reloading");
      setTimeout(function () { location.reload(); }, 800);
      return;
    }
    if (!el) {
      css();
      if (!document.body) return;
      el = document.createElement("div");
      el.id = "omg-trial";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.innerHTML = "Approved access — <b>" + hms(secondsRemaining) + "</b> remaining";
  }

  function startTrialCountdown() {
    return getClient().then(function (sb) {
      return sb.rpc("start_trial_countdown").then(function (r) {
        if (r.error) {
          if (!/does not exist|schema cache/i.test(r.error.message || "")) {
            console.warn("[OmegaChrono] start_trial_countdown failed", r.error);
          }
          return;
        }
        var d = Array.isArray(r.data) ? r.data[0] : r.data;
        if (!d || !d.expires_at) return;   // permanent member: no countdown

        st.trialExpiresAt = new Date(d.expires_at).getTime();
        // Anchor to the server's own remaining seconds, not to the client
        // clock, so a wrong device time cannot extend the window.
        var localAnchor = Date.now();
        var serverLeft = d.seconds_remaining;

        clearInterval(st.trialTimer);
        st.trialTimer = setInterval(function () {
          var elapsed = Math.floor((Date.now() - localAnchor) / 1000);
          trialBanner(serverLeft - elapsed);
        }, TICK_MS);
        trialBanner(serverLeft);

        // Re-anchor against the server every 30s so drift cannot accumulate.
        setInterval(function () {
          sb.rpc("check_trial_status").then(function (rr) {
            var s = rr && rr.data && (Array.isArray(rr.data) ? rr.data[0] : rr.data);
            if (s && typeof s.seconds_remaining === "number") {
              serverLeft = s.seconds_remaining;
              localAnchor = Date.now();
            }
          }).catch(function () {});
        }, 30000);
      });
    }).catch(function (e) { console.warn("[OmegaChrono] trial init error", e); });
  }

  /* -------------------------------------------------------------------- boot */
  function boot() {
    getClient().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var session = r && r.data && r.data.session;
        if (!session) return;   // signed-out: no chronometer

        sb.auth.onAuthStateChange(function (event) {
          if (event === "SIGNED_OUT") { pause("signed out"); stop(); }
        });

        startTrialCountdown();

        return sb.rpc("get_engagement_status").then(function (res) {
          if (res.error) {
            if (/does not exist|schema cache/i.test(res.error.message || "")) {
              console.warn("[OmegaChrono] engagement functions missing — apply " +
                           "migrations/0006_chronometers.sql");
            }
            return;
          }
          var d = Array.isArray(res.data) ? res.data[0] : res.data;
          st.accrued   = (d && d.seconds_accumulated) || 0;
          st.target    = (d && d.seconds_target) || 33437;
          st.completed = !!(d && d.completed);

          st.running = true;
          watchPresence();
          paint();
          beat();
          st.beatTimer = setInterval(beat, BEAT_MS);
          st.tickTimer = setInterval(tick, TICK_MS);
        });
      });
    }).catch(function (e) { console.warn("[OmegaChrono] boot failed", e); });
  }

  window.OmegaChrono = {
    pause:  function () { pause("manual"); },
    resume: function () { resume("manual"); },
    stop:   stop,
    status: function () {
      return getClient()
        .then(function (sb) { return sb.rpc("get_engagement_status"); })
        .then(function (r) {
          var d = r && r.data && (Array.isArray(r.data) ? r.data[0] : r.data);
          console.table(d || { error: r && r.error });
          return d;
        });
    }
  };

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
