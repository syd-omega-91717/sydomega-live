"""Micro-lessons (blueprint 828): "opt-in micro-lessons: flashcard reviews offered in short idle moments, never pushed".

The restraints ARE the feature, so each is pinned: off unless the member turned it on, no system notification, sound, focus change or navigation, a long idle first, never while typing or over a visible dialog or the guided
tour, never in quiet hours, capped per day with a gap, and never when nothing is due. The behaviours were exercised in Chromium with a fake clock (a control scenario found one real bug: three hidden aria-modal
dialogs on dashboard.html made the module permanently busy); these tests keep the source from drifting back.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = (ROOT / "omega-microlesson.js").read_text(encoding="utf-8")
JS = re.sub(r"/\*.*?\*/", "", RAW, flags=re.S)
JS = re.sub(r"(?m)^\s*//.*$", "", JS)
REMINDERS = (ROOT / "omega-reminders.js").read_text(encoding="utf-8")
BG = (ROOT / "bg.js").read_text(encoding="utf-8")
NOTIF = (ROOT / "notifications.html").read_text(encoding="utf-8")


def const(src, name):
    m = re.search(r"\b%s\s*=\s*([^,;]+)" % name, src)
    return m.group(1).strip() if m else None


class MicroLesson(unittest.TestCase):
    def test_no_markup_is_built_from_data(self):
        for bad in ("innerHTML", "insertAdjacentHTML", "outerHTML", "document.write", "eval(", "new Function"):
            self.assertNotIn(bad, JS, bad)
        self.assertNotRegex(JS, r"\bon[a-z]+\s*=\s*['\"]")

    def test_it_is_off_unless_the_member_turned_it_on(self):
        self.assertIn("return { on: p.on === true };", JS)
        self.assertNotRegex(JS, r"on:\s*true", "no default-on path")

    def test_it_never_pushes(self):
        for pushy in ("Notification", "serviceWorker", "new Audio", "AudioContext", ".focus(", "location.href", "location.assign", "location.replace", "window.open", "vibrate"):
            self.assertNotIn(pushy, JS, pushy)

    def test_the_idle_threshold_and_caps(self):
        self.assertEqual(const(JS, "IDLE_MS"), "90000")
        self.assertEqual(const(JS, "MAX_PER_DAY"), "2")
        self.assertEqual(const(JS, "GAP_MS"), "3 * 3600000")
        self.assertIn("s.n < MAX_PER_DAY && (Date.now() - s.t) >= GAP_MS", JS)

    def test_quiet_hours_match_the_reminders_module(self):
        for name in ("QUIET_START", "QUIET_END"):
            self.assertEqual(const(JS, name), const(REMINDERS, name), name)

    def test_quiet_hours_actually_gate_the_offer(self):
        """Matching the reminders module's constants is not enough: the offer must be refused inside them."""
        self.assertIn("function quiet() { var m = nowMin(); return m >= QUIET_START || m < QUIET_END; }", JS)
        elig = JS[JS.index("function eligible()"):JS.index("var last = Date.now()")]
        self.assertRegex(elig, r"if \(quiet\(\) \|\| busy\(\)\) return false;")

    def test_it_waits_for_real_inactivity(self):
        self.assertIn("Date.now() - last < IDLE_MS", JS)
        for ev in ("keydown", "pointerdown", "pointermove", "wheel", "touchstart", "scroll"):
            self.assertIn("'%s'" % ev, JS, ev)

    def test_it_is_busy_while_typing_or_over_anything_the_member_can_see(self):
        block = JS[JS.index("function busy()"):JS.index("function eligible()")]
        for tag in ("INPUT", "TEXTAREA", "SELECT", "isContentEditable"):
            self.assertIn(tag, block)
        self.assertIn("shown(ds[i])", block)
        self.assertIn(".shepherd-element", block)
        self.assertIn("for (var j = 0; j < tour.length; j++) if (shown(tour[j])) return true;", block, "finding the tour is not enough: a visible one must make the module busy")
        self.assertIn("omega-reminder-card", block)

    def test_a_hidden_dialog_does_not_count_as_busy(self):
        """dashboard.html carries three hidden aria-modal dialogs; counting them made the module permanently busy there."""
        block = JS[JS.index("function busy()"):JS.index("function eligible()")]
        self.assertNotRegex(block, r"if \(document\.querySelector\('\[role=\"dialog\"\]\[aria-modal=\"true\"\]'\)\) return true;")
        shown = JS[JS.index("function shown("):JS.index("function busy()")]
        self.assertIn("r.width > 0 && r.height > 0", shown)
        self.assertIn("c.display !== 'none' && c.visibility !== 'hidden'", shown)

    def test_it_stays_off_public_pages_and_before_the_member_is_confirmed(self):
        pub = re.search(r"var PUBLIC = (/[^;]+/);", JS).group(1)
        rx = re.compile(pub.strip("/"))
        for page in ("/", "/index.html", "/account.html", "/enter.html", "/reset.html", "/terms.html", "/pending.html"):
            self.assertRegex(page, rx, page)
        for page in ("/dashboard.html", "/profile.html", "/notifications.html", "/academy.html"):
            self.assertIsNone(rx.fullmatch(page), page)
        self.assertIn("omega-approval-confirmed", JS)

    def test_it_says_nothing_and_spends_no_offer_when_nothing_is_due(self):
        self.assertIn("var total = window.OmegaReview.counts().total;", JS)
        block = JS[JS.index("var total = window.OmegaReview.counts().total;"):JS.index("showCard(total);")]
        self.assertLess(block.index("if (!(total > 0)) return;"), block.index("write(SK"), "the offer is spent only after the count is known to be above zero")

    def test_the_count_is_the_review_queues_own_and_no_duration_is_promised(self):
        self.assertNotRegex(JS, r"(?i)\bminutes?\b|\bseconds? each\b|\bquick\b")
        self.assertIn("total + (total === 1 ? ' card or word is due.' : ' cards and words are due.')", JS)

    def test_not_now_ends_the_days_offers(self):
        self.assertIn("write(SK, { d: s.d, n: MAX_PER_DAY, t: Date.now() })", JS)

    def test_the_card_is_polite_and_in_the_reminders_corner(self):
        self.assertIn("setAttribute('role', 'status')", JS)
        self.assertIn("setAttribute('aria-live', 'polite')", JS)
        self.assertIn("top:calc(env(safe-area-inset-top,0px) + 64px)", JS)
        self.assertIn("min-height:44px", JS)

    def test_the_review_modules_are_loaded_only_on_demand(self):
        self.assertIn("load('/omega-srs.js'", JS)
        self.assertIn("load('/omega-review.js'", JS)
        self.assertNotIn("omega-srs.js", BG)
        self.assertNotIn("omega-review.js", BG.replace("(omega-reminders.js, omega-review.js)", ""))

    def test_it_is_loaded_site_wide_and_the_toggle_is_in_notifications(self):
        self.assertIn("script[data-omega-microlesson-mod]", BG)
        self.assertIn("_s_data_omega_microlesson.src='/omega-microlesson.js';", BG)
        reminders_tab = NOTIF[NOTIF.index('id="tab-reminders"'):]
        self.assertLess(reminders_tab.index("data-omega-reminders"), reminders_tab.index("data-omega-microlesson"))

    def test_type_floor(self):
        sizes = [int(x) for x in re.findall(r"font-size:(\d+)px", JS)]
        self.assertTrue(sizes and all(s >= 12 for s in sizes), sizes)

    def test_it_declares_itself_once(self):
        self.assertIn("if (window.OmegaMicroLesson) return;", JS)
        self.assertEqual(len(re.findall(r"window\.OmegaMicroLesson\s*=", JS)), 1)


if __name__ == "__main__":
    unittest.main()
