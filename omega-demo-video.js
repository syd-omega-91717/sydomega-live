/* ============================================================================
   SYD OMEGA 91717 -- WELCOME DEMO VIDEO
   Plays SYDOMEGA91717_DEMOD-1-.mp4 once for verified members and subscribers
   the first time they enter the platform (web + the installed PWA, which is
   what powers "mobile" on this stack -- see manifest.json). Never shown to
   signed-out visitors or to pending/unapproved members.

   Eligible = access_approved = true, OR subscription_status = 'active',
   OR is_owner = true. Shown once (tracked by profiles.demo_watched_at, added
   by supabase/omega_demo_video.sql -- run that migration before this can
   mark itself watched; until then it will offer the video every visit).

   Replay anytime: window.OmegaDemo.replay() -- wired to the "WATCH DEMO
   AGAIN" button on /settings.html.

   Respects prefers-reduced-motion: those members get a click-to-play state
   instead of autoplay (this is content they asked to see, not ambient motion,
   so it is never suppressed entirely -- just not forced on them).
   Pure ASCII. Loaded on every page via <script src="/omega-demo-video.js">.
   ============================================================================ */
(function () {
  "use strict";
  if (window.__omegaDemoVideo) return;
  window.__omegaDemoVideo = 1;

  var VIDEO_SRC = "/SYDOMEGA91717_DEMOD-1-.mp4";
  var SUPABASE_URL = "https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var SUPABASE_KEY = "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";

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
    "justify-content:center;font-size:22px;color:#000;box-shadow:0 0 30px rgba(201,168,76,.5)}"
  ].join("");
  var styleTag = document.createElement("style");
  styleTag.id = "omg-demo-css";
  styleTag.textContent = css;
  (document.head || document.documentElement).appendChild(styleTag);

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var sbPromise = null;
  function getClient() {
    if (!sbPromise) {
      sbPromise = window.OmegaSB ? window.OmegaSB.get()
        : import("https://esm.sh/@supabase/supabase-js@2").then(function (m) {
        return m.createClient(SUPABASE_URL, SUPABASE_KEY);
      });
    }
    return sbPromise;
  }

  function markWatched(sb, userId) {
    try {
      sb.from("profiles").update({ demo_watched_at: new Date().toISOString() })
        .eq("id", userId).then(function () {}).catch(function () {});
    } catch (e) {}
  }

  function openModal(onDone) {
    if (document.getElementById("omg-demo-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "omg-demo-overlay";
    overlay.innerHTML =
      '<div id="omg-demo-box">' +
        '<div id="omg-demo-head"><span>&#937; WELCOME TO SYD OMEGA 91717</span>' +
          '<button id="omg-demo-close">SKIP &times;</button></div>' +
        '<video id="omg-demo-video" playsinline webkit-playsinline controls' +
          (reduceMotion ? "" : " muted") + '>' +
          '<source src="' + VIDEO_SRC + '" type="video/mp4">' +
        '</video>' +
        (reduceMotion ? '<div id="omg-demo-playgate"><div class="pb">&#9654;</div></div>' : '') +
      "</div>";
    document.body.appendChild(overlay);

    var video = overlay.querySelector("#omg-demo-video");
    var closeBtn = overlay.querySelector("#omg-demo-close");
    var playgate = overlay.querySelector("#omg-demo-playgate");

    function finish() {
      overlay.remove();
      if (onDone) onDone();
    }
    closeBtn.addEventListener("click", finish);
    video.addEventListener("ended", finish);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) finish(); });

    if (playgate) {
      playgate.addEventListener("click", function () {
        playgate.remove();
        video.muted = false;
        video.play().catch(function () {});
      });
    } else {
      video.play().catch(function () {
        // autoplay blocked even muted -- fall back to a play gate
        var pg = document.createElement("div");
        pg.id = "omg-demo-playgate";
        pg.innerHTML = '<div class="pb">&#9654;</div>';
        overlay.querySelector("#omg-demo-box").appendChild(pg);
        pg.addEventListener("click", function () {
          pg.remove();
          video.play().catch(function () {});
        });
      });
    }
  }

  function boot() {
    getClient().then(function (sb) {
      sb.auth.getSession().then(function (r) {
        var session = r && r.data && r.data.session;
        if (!session) return; // signed-out visitors never see it

        sb.from("profiles")
          .select("access_approved,subscription_status,is_owner,demo_watched_at")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(function (res) {
            var d = res && res.data;
            if (!d) return;
            var eligible = d.is_owner === true || d.access_approved === true ||
              d.subscription_status === "active";
            if (!eligible || d.demo_watched_at) return;

            openModal(function () { markWatched(sb, session.user.id); });
          })
          .catch(function () {});
      }).catch(function () {});
    }).catch(function () {});
  }

  window.OmegaDemo = {
    replay: function () { openModal(function () {}); }
  };

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
