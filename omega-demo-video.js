/* ============================================================================
   SYD OMEGA 91717 — omega-demo-video.js  (v2)

   Plays the welcome demo once for eligible members, and on demand from
   /settings.html via window.OmegaDemo.replay().

   ----------------------------------------------------------------------------
   WHY v1 DID NOT RUN — three separate faults, all found by audit
   ----------------------------------------------------------------------------
   1. IT WAS NOT ON THE PAGE MEMBERS LAND ON.
      v1's own header says "Loaded on every page via <script src>". It was on
      41 of 105 pages. dashboard.html — the page account.html redirects to
      after every successful login (two `location.href='/dashboard.html'`
      calls) — was NOT one of them. Members logged in, landed on dashboard,
      and the module was never loaded. Autoplay could not fire because the
      code was not there.
      FIX: registered in bg.js, which loads on 104 of 105 pages. The per-page
      <script> tags remain harmless — the __omegaDemoVideo guard dedupes.

   2. THE VIDEO COULD NOT STREAM.
      SYDOMEGA91717_DEMOD-1-.mp4 had its `moov` atom AFTER `mdat`, so a browser
      had to download all 3.7 MB before it could begin playback. The modal
      would open and sit blank, and video.play() could reject before the first
      frame existed. Fixed by remuxing with `-movflags +faststart` (no
      re-encode, no quality loss) — see assets/ in this bundle.

   3. EVERY FAILURE WAS SWALLOWED.
      v1 ended each promise with `.catch(function(){})` and returned silently
      on `if (!d) return;`. If `demo_watched_at` or `subscription_status` did
      not exist in production, PostgREST returned 400, `res.data` was null, and
      the module gave up without a single console message. Nothing was
      diagnosable.
      FIX: columns are probed rather than assumed, every failure is logged with
      a reason, and window.OmegaDemo.diagnose() prints a full report.

   ----------------------------------------------------------------------------
   DIAGNOSING IN THE BROWSER
       await window.OmegaDemo.diagnose()   -> prints why it did or did not play
       window.OmegaDemo.replay()           -> force it open, ignores all gating
       window.OmegaDemo.reset()            -> clear the "already watched" mark
   ============================================================================ */

(function () {
  "use strict";
  if (window.__omegaDemoVideo) return;
  window.__omegaDemoVideo = 1;

  var VIDEO_SRC    = "/SYDOMEGA91717_DEMOD-1-.mp4";
  var SUPABASE_URL = "https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var SUPABASE_KEY = "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";
  var LS_KEY       = "omega_demo_watched_at";   // fallback when the column is absent

  var state = { lastReason: "not run yet", lastError: null };
  function note(reason, err) {
    state.lastReason = reason;
    state.lastError = err || null;
    if (err) console.warn("[OmegaDemo]", reason, err);
    else console.info("[OmegaDemo]", reason);
  }

  /* ------------------------------------------------------------------ styles */
  var css = [
    "#omg-demo-overlay{position:fixed;inset:0;z-index:9999;background:rgba(5,5,10,.88);",
    "backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;",
    "align-items:center;justify-content:center;padding:20px;animation:omg-demo-fade .3s ease}",
    "@keyframes omg-demo-fade{from{opacity:0}to{opacity:1}}",
    "#omg-demo-box{position:relative;width:min(920px,94vw);background:#0A0A0F;",
    "border:1px solid rgba(201,168,76,.35);border-radius:14px;overflow:hidden;",
    "box-shadow:0 20px 80px rgba(0,0,0,.6),0 0 40px rgba(201,168,76,.08)}",
    "#omg-demo-box video{display:block;width:100%;max-height:78vh;background:#000}",
    "#omg-demo-head{display:flex;align-items:center;justify-content:space-between;",
    "padding:12px 16px;border-bottom:1px solid rgba(201,168,76,.18);",
    "font-family:'Cinzel Decorative',serif;color:#C9A84C;font-size:13px;letter-spacing:2px}",
    "#omg-demo-close{cursor:pointer;color:#888;font-family:'Rajdhani',sans-serif;",
    "font-size:12px;letter-spacing:1px;border:1px solid rgba(201,168,76,.3);",
    "padding:5px 12px;border-radius:6px;background:transparent;transition:all .2s}",
    "#omg-demo-close:hover{color:#C9A84C;border-color:#C9A84C}",
    "#omg-demo-playgate{position:absolute;inset:0;top:41px;display:flex;",
    "align-items:center;justify-content:center;background:rgba(0,0,0,.5);cursor:pointer}",
    "#omg-demo-playgate .pb{width:64px;height:64px;border-radius:50%;",
    "background:radial-gradient(circle,#C9A84C,#8B6A2A);display:flex;align-items:center;",
    "justify-content:center;font-size:22px;color:#000;box-shadow:0 0 30px rgba(201,168,76,.5)}",
    "#omg-demo-status{padding:10px 16px;font-family:'Rajdhani',sans-serif;font-size:12px;",
    "color:#9a8a5a;letter-spacing:1px;text-align:center}"
  ].join("");
  function injectCss() {
    if (document.getElementById("omg-demo-css")) return;
    var s = document.createElement("style");
    s.id = "omg-demo-css";
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ client */
  var sbPromise = null;
  function getClient() {
    if (!sbPromise) {
      sbPromise = window.OmegaSB && typeof window.OmegaSB.get === "function"
        ? Promise.resolve(window.OmegaSB.get())
        : import("/vendor/supabase-js.js").then(function (m) {
            return m.createClient(SUPABASE_URL, SUPABASE_KEY);
          });
    }
    return sbPromise;
  }

  /* Probe which of the optional columns actually exist. v1 assumed all four and
     a single missing one produced a 400 that killed the whole feature. */
  function selectProfile(sb, uid) {
    var full = "access_approved,subscription_status,is_owner,demo_watched_at";
    return sb.from("profiles").select(full).eq("id", uid).maybeSingle()
      .then(function (res) {
        if (!res.error) return { data: res.data, degraded: false };
        note("full profile select failed; retrying with core columns only", res.error);
        return sb.from("profiles").select("access_approved,is_owner").eq("id", uid)
          .maybeSingle()
          .then(function (r2) {
            if (r2.error) throw r2.error;
            return { data: r2.data, degraded: true };
          });
      });
  }

  function markWatched(sb, uid) {
    try { localStorage.setItem(LS_KEY, new Date().toISOString()); } catch (e) {}
    if (!sb || !uid) return;
    try {
      sb.from("profiles")
        .update({ demo_watched_at: new Date().toISOString() })
        .eq("id", uid)
        .then(function (r) {
          if (r && r.error) {
            note("could not persist demo_watched_at — run supabase/omega_demo_video.sql; " +
                 "falling back to this browser's local storage", r.error);
          }
        });
    } catch (e) {
      note("markWatched threw", e);
    }
  }

  function locallyWatched() {
    try { return !!localStorage.getItem(LS_KEY); } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------- modal */
  function openModal(onDone) {
    injectCss();
    if (document.getElementById("omg-demo-overlay")) return;
    if (!document.body) { note("openModal called before <body> existed"); return; }

    var overlay = document.createElement("div");
    overlay.id = "omg-demo-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Welcome demo");
    overlay.innerHTML =
      '<div id="omg-demo-box">' +
        '<div id="omg-demo-head"><span>&#937; WELCOME TO SYD OMEGA 91717</span>' +
          '<button id="omg-demo-close">SKIP &times;</button></div>' +
        '<video id="omg-demo-video" playsinline webkit-playsinline controls preload="auto"' +
          (reduceMotion ? "" : " muted") + '>' +
          '<source src="' + VIDEO_SRC + '" type="video/mp4">' +
        '</video>' +
        '<div id="omg-demo-status"></div>' +
        (reduceMotion ? '<div id="omg-demo-playgate"><div class="pb">&#9654;</div></div>' : '') +
      "</div>";
    document.body.appendChild(overlay);

    var video   = overlay.querySelector("#omg-demo-video");
    var status  = overlay.querySelector("#omg-demo-status");
    var closeBtn= overlay.querySelector("#omg-demo-close");
    var gate    = overlay.querySelector("#omg-demo-playgate");
    var done    = false;

    function finish() {
      if (done) return;
      done = true;
      overlay.remove();
      if (onDone) onDone();
    }

    /* The video failing to load is the single most likely visible symptom, and
       v1 had no handler for it at all — the modal just sat black. */
    video.addEventListener("error", function () {
      var e = video.error;
      var msg = e && e.code === 4
        ? "Video could not be loaded. Check that " + VIDEO_SRC + " is deployed."
        : "Video error (code " + (e ? e.code : "?") + ").";
      status.textContent = msg;
      note(msg, e);
    });
    video.addEventListener("stalled", function () {
      status.textContent = "Buffering...";
    });
    video.addEventListener("playing", function () { status.textContent = ""; });

    closeBtn.addEventListener("click", finish);
    video.addEventListener("ended", finish);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) finish(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { document.removeEventListener("keydown", esc); finish(); }
    });

    function showGate(unmute) {
      if (overlay.querySelector("#omg-demo-playgate")) return;
      var pg = document.createElement("div");
      pg.id = "omg-demo-playgate";
      pg.innerHTML = '<div class="pb">&#9654;</div>';
      overlay.querySelector("#omg-demo-box").appendChild(pg);
      pg.addEventListener("click", function () {
        pg.remove();
        if (unmute) video.muted = false;
        video.play().catch(function (err) { note("play() rejected after gate", err); });
      });
    }

    if (gate) {
      gate.addEventListener("click", function () {
        gate.remove();
        video.muted = false;
        video.play().catch(function (err) { note("play() rejected", err); });
      });
      note("reduced-motion active: showing click-to-play gate");
    } else {
      video.play().then(function () {
        note("autoplay started");
      }).catch(function (err) {
        note("autoplay blocked even muted — showing play gate", err);
        showGate(false);
      });
    }
  }

  /* -------------------------------------------------------------------- boot */
  function boot() {
    getClient().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var session = r && r.data && r.data.session;
        if (!session) { note("no session — signed-out visitors never see the demo"); return; }

        return selectProfile(sb, session.user.id).then(function (out) {
          var d = out.data;
          if (!d) { note("no profiles row for this user — see migrations/0004_signup_pipeline.sql"); return; }

          var eligible = d.is_owner === true ||
                         d.access_approved === true ||
                         d.subscription_status === "active";
          if (!eligible) { note("member not eligible (not approved, not subscribed, not owner)"); return; }

          var watched = out.degraded ? locallyWatched()
                                     : (!!d.demo_watched_at || locallyWatched());
          if (watched) { note("already watched — use OmegaDemo.reset() to see it again"); return; }

          note("eligible and unwatched — opening");
          openModal(function () { markWatched(sb, session.user.id); });
        });
      });
    }).catch(function (err) {
      note("boot failed", err);
    });
  }

  /* --------------------------------------------------------------------- api */
  window.OmegaDemo = {
    replay: function () { note("manual replay"); openModal(function () {}); },

    reset: function () {
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      return getClient().then(function (sb) {
        return sb.auth.getSession().then(function (r) {
          var s = r && r.data && r.data.session;
          if (!s) return;
          return sb.from("profiles").update({ demo_watched_at: null }).eq("id", s.user.id);
        });
      }).then(function () { console.info("[OmegaDemo] reset. Reload to see it."); });
    },

    /* Prints exactly why the demo did or did not play. */
    diagnose: function () {
      var report = {
        moduleLoaded: true,
        lastReason: state.lastReason,
        lastError: state.lastError && (state.lastError.message || state.lastError),
        videoSrc: VIDEO_SRC,
        reducedMotion: reduceMotion,
        locallyMarkedWatched: locallyWatched()
      };
      return fetch(VIDEO_SRC, { method: "HEAD" })
        .then(function (r) {
          report.videoStatus = r.status;
          report.videoBytes = r.headers.get("content-length");
          report.videoReachable = r.ok;
        })
        .catch(function (e) { report.videoReachable = false; report.videoFetchError = String(e); })
        .then(function () { return getClient(); })
        .then(function (sb) {
          return sb.auth.getSession().then(function (r) {
            var s = r && r.data && r.data.session;
            report.signedIn = !!s;
            if (!s) return;
            return selectProfile(sb, s.user.id).then(function (o) {
              report.profileFound = !!o.data;
              report.degradedColumns = o.degraded;
              if (o.data) {
                report.access_approved = o.data.access_approved;
                report.is_owner = o.data.is_owner;
                report.subscription_status = o.data.subscription_status;
                report.demo_watched_at = o.data.demo_watched_at;
              }
            });
          });
        })
        .catch(function (e) { report.diagnoseError = String(e); })
        .then(function () { console.table(report); return report; });
    }
  };

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
