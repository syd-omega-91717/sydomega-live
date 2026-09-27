/* ==========================================================================
   Ω SYD OMEGA 91717 — SPACED REPETITION (omega-srs.js)

   The one SM-2 scheduler. flashcard.html and vocabulary.html each carried
   their own copy, and they had drifted (CLAUDE.md §8.1 class 8):
   - flashcard.html mapped its HARD button to quality 2, below SM-2's pass
     mark of 3, so HARD reset a card to one day exactly like AGAIN -- while
     the page's own explainer said HARD/GOOD/EASY "increase the interval";
   - vocabulary.html updated the ease factor BEFORE computing the interval,
     flashcard.html after. The original algorithm (Wozniak, SuperMemo 2)
     computes I(n) = I(n-1) * EF with the item's current EF, then adjusts
     EF from the grade. This module does that, for both.

   The review queue (omega-review.js) uses the same functions, so a card
   graded in the queue and one graded on its page are scheduled alike.

   Items keep their page's own field names -- nothing stored is migrated:
     card (omega_fc_cards): reps, interval, ef, due, lastReviewed
     word (omega_vocab):    repetitions, interval, easiness, nextReview, status

   Grades are SM-2 quality 0-5 (>= 3 is a pass). The four-button scale
   AGAIN / HARD / GOOD / EASY is quality 1 / 3 / 4 / 5 -- BUTTONS below.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaSRS) return;

  var F = {
    card: { reps: 'reps', ef: 'ef', due: 'due' },
    word: { reps: 'repetitions', ef: 'easiness', due: 'nextReview' }
  };
  var BUTTONS = [
    { key: '1', label: 'AGAIN', q: 1 },
    { key: '2', label: 'HARD', q: 3 },
    { key: '3', label: 'GOOD', q: 4 },
    { key: '4', label: 'EASY', q: 5 }
  ];

  /* Same date convention as both pages (UTC ISO day). */
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }

  function num(v, dflt) { v = +v; return isFinite(v) ? v : dflt; }

  /* The next interval, in days, for grade q -- without changing the item. */
  function nextInterval(item, q, kind) {
    var f = F[kind] || F.card;
    if (q < 3) return 1;
    var reps = num(item[f.reps], 0);
    if (reps === 0) return 1;
    if (reps === 1) return 6;
    return Math.max(1, Math.round(num(item.interval, 1) * num(item[f.ef], 2.5)));
  }

  function review(item, q, kind) {
    var f = F[kind] || F.card;
    q = Math.max(0, Math.min(5, Math.round(num(q, 0))));
    var ef = num(item[f.ef], 2.5);
    item.interval = nextInterval(item, q, kind);
    if (q < 3) {
      item[f.reps] = 0;                       // restart; EF unchanged (SM-2)
    } else {
      item[f.reps] = num(item[f.reps], 0) + 1;
      item[f.ef] = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    }
    item[f.due] = addDays(item.interval);
    if (kind === 'card') item.lastReviewed = iso(new Date());
    if (kind === 'word' && q >= 3) item.status = item.interval >= 21 ? 'mastered' : 'learning';
    return item;
  }

  function hint(days) {
    if (days < 30) return days + 'd';
    return Math.round(days / 30) + 'mo';
  }

  /* Due today or earlier. A card never studied (due null) is NEW, not due --
     the same rule omega-today.js counts, so its number and the queue agree. */
  function isDue(item, kind, today) {
    var f = F[kind] || F.card, d = item && item[f.due];
    return !!d && d <= (today || iso(new Date()));
  }

  window.OmegaSRS = {
    BUTTONS: BUTTONS, review: review, nextInterval: nextInterval, isDue: isDue,
    hint: function (item, q, kind) { return q < 3 ? '<1d' : hint(nextInterval(item, q, kind)); }
  };
})();
