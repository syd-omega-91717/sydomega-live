### Opt-in micro-lessons ship; the density idea is measured and stays proposed (2026-11-23)

**Why.** The weekly idea routine asked for one low-risk proposed item. The first candidate, blueprint 168 (member-chosen information density), was dropped after measuring it: the platform already sets a density profile per page (`omega-page-world.js:128`, rules at `omega-platform-experience-v5.css:383-440`), chosen by the page and not the member, but those profiles move page height by 0-0.2%; a shared line-height and padding override prototyped on five pages measured -4% to +2% (`profile.html` got taller), inside run-to-run noise. A toggle on either would be a control that does almost nothing, which is a false affordance, so it was not built. The second candidate, blueprint 828 (opt-in micro-lessons: reviews offered in short idle moments, never pushed), is buildable honestly and was.

**Fix.** `omega-microlesson.js` (new, injected by `bg.js` like `omega-reminders.js`, whose conventions it follows) plus a toggle on `notifications.html` (Reminders tab, `data-omega-microlesson`).
- Inert until the member turns it on; stores `omega_micro_prefs` and `omega_micro_sent` only.
- After about 90 s with no input a small `role="status"` card offers a review of what `omega-review.js` counts as due (`OmegaReview.counts().total`, the figure the session itself uses). REVIEW opens the existing review queue; NOT NOW ends the offers for the day.
- "Never pushed" as code: no system notification, sound, focus change or navigation; never while typing or over a visible dialog or the guided tour; never 22:30-07:30 (the reminders module's window); at most twice a day, 3 hours apart; never when nothing is due, and then no offer is spent. No duration is promised.
- `omega-srs.js` and `omega-review.js`, loaded only on `academy.html`, are added on demand and only for an opted-in, idle member.

**Verified.** Chromium, Playwright fake clock, 11 scenarios on `dashboard.html` with seeded review data:
- Control (on, 3 words + 2 cards due, 2 min idle): card appears, "5 cards and words are due", `role="status"`, no focus taken, one offer recorded.
- Off by default: nothing. Nothing due: nothing, and no offer spent. Input focused: nothing. Quiet hours (23:10): nothing. Only 60 s idle: nothing. Guided tour on screen (confirmed visible): nothing. Two offers already today: nothing.
- REVIEW click: the card goes and the review queue opens as a dialog. NOT NOW: nothing for the rest of the day, checked 5 h later. Timing: auto-dismiss at 45 s, nothing at 1 h, a second offer after 3 h+, no third.
- Settings toggle on `notifications.html`: starts OFF with nothing stored, ON persists `{"on":true}` and shows the honest count ("Due right now: 2" for two seeded words), OFF persists again; 0 page errors.
- `scripts/tests/test_microlesson.py`: 17 tests; 12 distinct reintroduced faults, each caught (1 s idle, cap 99, no gap, default-on, no quiet hours, `quiet()` always false, a `Notification`, a stolen focus, an offer spent when nothing is due, hidden dialogs counting as busy, the tour guard removed, a promised duration). Two of those, no quiet hours and no tour guard, survived the first version of the tests and were caught only after they were strengthened.

**Two defects the verification itself found, both in this change and both fixed before it merged.**
- The first control scenario showed no card at all. `busy()` counted any `[role="dialog"][aria-modal]` element in the DOM, and `dashboard.html` carries three hidden ones, so the module was permanently busy there. It now counts only a dialog with a layout box that is not `display:none` or `visibility:hidden`. Every "nothing appeared" row before that fix was meaningless, which is why the control must pass first.
- The platform's guided tour (Shepherd) is a modal overlay but not an `aria-modal` dialog, so the card could have appeared over it. It is now treated as busy, and a scenario with the tour on screen proves it.
- The first test run also let two mutations survive (quiet hours removed; the tour check removed while its selector string remained), because the assertions matched strings and not behaviour. Both are now pinned and caught.
- An earlier run of the scenarios appeared to hang for 25 minutes: it was piped through `tail`, which hides all output until exit, and simulated hours of 5-second ticks. Fixed by jumping the clock and printing live.

**Not done / not verified.**
- English-only copy; no `data-i18n` keys were added.
- The preference is stored in `localStorage`; `omega-member-state.js` mirrors `omega_*` keys by its `PREFIX` rule (read from its source). That mirroring, and cross-device behaviour, were not exercised.
- Verified on `dashboard.html` only; the module runs on every non-public page, and pages with their own fixed bottom or top-right widgets were not each checked for overlap (the card sits in the reminders' corner and stands down if a reminder card is showing).
- Real data: tested with seeded `localStorage`, not a real member's decks.
- Chromium only.
