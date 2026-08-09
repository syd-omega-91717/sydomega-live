/* ============================================================================
   SYD OMEGA 91717 -- STREAK FREEZE
   Grace-day / streak-forgiveness mechanic for the platform's local,
   localStorage-backed streak pages (habits.html, journal.html, water.html --
   none of these persist their daily logs to Supabase, so this stays
   consistent with their existing data model rather than inventing a server
   dependency none of them currently have).

   WHY THIS EXISTS
   2026 research on habit-tracking retention is consistent: streak-freeze /
   grace-day mechanics moved from a premium differentiator to a baseline
   expectation, and Duolingo's freeze redesign measurably cut churn among
   members who were about to lose a streak. This platform's streak displays
   (habits.html's "BEST STREAK", journal.html/water.html's day counters) had
   no forgiveness at all -- one missed day and the streak silently resets to
   zero, which is exactly the failure mode that mechanic exists to prevent.

   MODEL
   Freezes are a small pool (default cap 3) that slowly replenish with
   continued engagement (+1 every 7 distinct active days, capped) and are
   consumed automatically -- never a manual "use a freeze" button, matching
   how this is normally presented (protection happens quietly, not as a
   transaction). A freeze is only ever spent to cover a day that is fully in
   the past (never "today", since today isn't missed until it ends) and only
   when it would actually save an active streak (a streak of 0 has nothing to
   protect). Frozen days are recorded permanently per scope key, so a freeze
   is spent at most once for a given day.

   USAGE
     OmegaStreakFreeze.reconcile(scopeKey, isDoneOnDate)
       Call once per page load, per habit/scope. isDoneOnDate(dateKey) is a
       predicate the caller already has (reads its own log store). Silently
       freezes yesterday if warranted; safe to call every render (idempotent
       -- a day already frozen is never re-frozen or re-charged).

     OmegaStreakFreeze.isFrozen(scopeKey, dateKey) -> boolean
     OmegaStreakFreeze.available(scopeKey) -> int
     OmegaStreakFreeze.cap -> int (3)
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaStreakFreeze) return;

  var STATE_KEY = 'omega_streak_freeze_v1';
  var CAP = 3;
  var EARN_EVERY_DAYS = 7; // +1 freeze per 7 distinct active (logged) days

  function dateKey(d) { return d.toISOString().slice(0, 10); }
  function yesterday() {
    var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 1);
    return d;
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function scope(state, scopeKey) {
    if (!state[scopeKey]) {
      state[scopeKey] = { available: 1, frozen: {}, activeDays: {}, lastEarnCount: 0 };
    }
    return state[scopeKey];
  }

  // Call whenever the caller knows `dateKey` was a genuinely active day
  // (a real completion, not a frozen one) -- feeds the replenishment count.
  function markActive(scopeKey, dKey) {
    var state = load();
    var s = scope(state, scopeKey);
    if (!s.activeDays[dKey]) {
      s.activeDays[dKey] = true;
      var total = Object.keys(s.activeDays).length;
      var earned = Math.floor(total / EARN_EVERY_DAYS);
      if (earned > s.lastEarnCount) {
        s.available = Math.min(CAP, s.available + (earned - s.lastEarnCount));
        s.lastEarnCount = earned;
      }
      save(state);
    }
  }

  function isFrozen(scopeKey, dKey) {
    var state = load();
    return !!(state[scopeKey] && state[scopeKey].frozen[dKey]);
  }

  function available(scopeKey) {
    var state = load();
    return state[scopeKey] ? state[scopeKey].available : 1;
  }

  // Freeze yesterday IFF: not logged, not already frozen, a freeze is
  // available, and there is an active streak (something worth protecting --
  // checked by the caller passing hadStreakBeforeYesterday).
  function reconcile(scopeKey, isDoneOnDate) {
    var yKey = dateKey(yesterday());
    if (isDoneOnDate(yKey)) { markActive(scopeKey, yKey); return; }

    var state = load();
    var s = scope(state, scopeKey);
    if (s.frozen[yKey]) return; // already handled, never double-charge
    if (s.available <= 0) return;

    // only worth protecting if the day before yesterday continued a streak
    var dayBefore = new Date(); dayBefore.setHours(0, 0, 0, 0);
    dayBefore.setDate(dayBefore.getDate() - 2);
    if (!isDoneOnDate(dateKey(dayBefore)) && !s.frozen[dateKey(dayBefore)]) return;

    s.frozen[yKey] = true;
    s.available -= 1;
    save(state);
  }

  window.OmegaStreakFreeze = {
    cap: CAP,
    reconcile: reconcile,
    isFrozen: isFrozen,
    available: available,
    markActive: markActive
  };
})();
