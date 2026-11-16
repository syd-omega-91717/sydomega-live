"""The command wall (omega-command-wall.js + its skeleton in the PLATFORM tab of dashboard.html).

The owner's reference (assets/concept/board-03.jpg) is a wall of invented telemetry: a world map of server nodes, ports 4000-4018, PPO RL agents, "consensus 100%", "network resonance 9.17Hz", a revenue
fortress buying gold, a 9-stage ladder already REJECTED in docs/IDEA_INTAKE.md. CLAUDE.md 8.1 class 9 (fabricated data rendered as fact) is why the wall is built from what the platform can measure, and this
file pins that: every panel has one real source, nothing is invented, and the flags fail closed.
"""
import glob
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = (ROOT / "omega-command-wall.js").read_text(encoding="utf-8")
# the header comment names the invented things while explaining why they are refused, so content checks read the code
JS = re.sub(r"/\*.*?\*/", "", RAW, flags=re.S)
JS = re.sub(r"(?m)^\s*//.*$", "", JS)
HTML = (ROOT / "dashboard.html").read_text(encoding="utf-8")
BLOCK = HTML[HTML.index("data-omega-command-wall"):HTML.index("</section>", HTML.index("data-omega-command-wall"))]
SCHEMA = json.loads((ROOT / "supabase" / "live-schema.json").read_text(encoding="utf-8"))["tables"]
MIGRATIONS = "".join(pathlib.Path(f).read_text(encoding="utf-8", errors="ignore") for f in glob.glob(str(ROOT / "supabase" / "migrations" / "*.sql")))


class CommandWall(unittest.TestCase):
    def test_no_markup_is_built_from_data(self):
        for bad in ("innerHTML", "insertAdjacentHTML", "outerHTML", "document.write", "eval(", "new Function"):
            self.assertNotIn(bad, JS, bad)
        self.assertNotRegex(JS, r"\bon[a-z]+\s*=\s*['\"]")

    def test_nothing_the_board_invents_is_drawn(self):
        for invented in ("9.17", "Hz", "4000", "4018", "PPO", "consensus", "resonance", "Munich", "G7", "malware", "physical", "rhodium", "bullion", "Override", "override", "SAND", "OMEGA_MASTER", "Math.random"):
            self.assertNotIn(invented, JS, invented)
        self.assertNotRegex(JS, r"[$€£]\s*\d|USD|currency")

    def test_the_sources_are_exactly_these(self):
        reads = re.findall(r"sb\.(?:from|rpc)\('([a-z_]+)'", JS)
        self.assertEqual(sorted(reads), ["get_platform_flag", "profiles"])
        self.assertEqual(sorted(re.findall(r"(?:getJSON|fetch)\('(/[a-z0-9-]+\.json)'", JS)), ["/omega-agents.json", "/omega-canon.json"])
        self.assertIn("window.__omegaData", JS)

    def test_every_column_read_exists_live(self):
        sel = re.search(r"from\('profiles'\)\.select\('([^']+)'\)", JS).group(1)
        have = set(SCHEMA.get("public.profiles") or SCHEMA.get("profiles"))
        self.assertEqual([c for c in sel.split(",") if c not in have], [])

    def test_profile_read_is_the_members_own_row_and_no_private_column(self):
        self.assertRegex(JS, r"from\('profiles'\)\.select\('[^']+'\)\.eq\('id',\s*s\.user\.id\)")
        sel = re.search(r"from\('profiles'\)\.select\('([^']+)'\)", JS).group(1).split(",")
        for private in ("dob", "birth_date", "phone", "email", "kyc_status", "kyc_doc_path", "country"):
            self.assertNotIn(private, sel)

    def test_the_supabase_client_comes_from_the_published_accessor(self):
        self.assertIn("window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null)", JS)
        for guessed in ("window.sb", "omegaSupabase", "OmegaSupabase"):
            self.assertNotIn(guessed, JS, "a guessed accessor is a shared global nothing publishes (CLAUDE.md 8.1 class 4b)")

    def test_the_flags_are_real_and_fail_closed(self):
        keys = re.findall(r"\['([a-z_]+_enabled)',\s*'[^']+'\]", JS)
        self.assertEqual(len(keys), 6)
        for k in keys:
            self.assertIn("'%s'" % k, MIGRATIONS, "%s is not seeded by any migration, so the wall would show a flag that does not exist" % k)
        self.assertIn("res.data === true", JS)
        self.assertIn("!res.error && res.data === true", JS)
        self.assertIn("'[UNKNOWN]'", JS)
        self.assertNotRegex(JS, r"className = 'ocw-flag on'|'ocw-flag on'\s*;", "nothing may start as on")

    def test_a_flag_that_cannot_be_read_is_never_shown_active(self):
        block = JS[JS.index("function renderFlags"):JS.index("async function boot")]
        self.assertIn("ocw-flag unk", block)
        self.assertRegex(block, r"rows\.forEach\(function \(r\) \{\s*sb\.rpc\('get_platform_flag'")
        self.assertRegex(RAW[RAW.index("function renderFlags"):RAW.index("async function boot")], r"function \(\) \{ /\* stays UNKNOWN")

    def test_the_gates_are_the_canons_own_twelve_names_not_a_typed_list(self):
        self.assertIn("canon.authority.gate_names", JS)
        canon = json.loads((ROOT / "omega-canon.json").read_text(encoding="utf-8"))
        self.assertEqual(len(canon["authority"]["gate_names"]), 12)
        for name in canon["authority"]["gate_names"]:
            self.assertNotIn("'%s'" % name, JS, "a gate name typed into the module would be a second copy of the canon")

    def test_the_agent_ring_uses_the_rosters_own_signs_and_art(self):
        block = JS[JS.index("function renderAgents"):JS.index("function renderAscension")]
        self.assertIn("signArt(a.sign)", block)
        for sign in ("Aries", "Taurus", "Gemini", "Virgo", "Pisces"):
            self.assertNotIn(sign, block)
        self.assertIn("width:44px;height:44px;margin:-22px 0 0 -22px", RAW)

    def test_the_agents_are_not_presented_as_a_running_network(self):
        self.assertIn("A naming system, not a running network.", JS)

    def test_the_skeleton_has_every_mount_and_sits_in_the_platform_tab(self):
        for key in re.findall(r"q\('([a-z]+)'\)", JS):
            self.assertIn('data-ocw="%s"' % key, BLOCK, key)
        platform = HTML.index('<div id="l-platform"')
        self.assertLess(platform, HTML.index("data-omega-command-wall"))
        self.assertGreater(HTML.index("platform-search"), HTML.index("data-omega-command-wall"), "the wall opens the tab, above the index")
        self.assertIn('<script src="/omega-command-wall.js" defer></script>', HTML)

    def test_every_panel_has_an_honest_failure_state(self):
        for phrase in ("The agent roster could not be read.", "The gates could not be read.", "Your gates could not be read right now.", "Sign in to see your gates.", "Sign in to see what is on."):
            self.assertIn(phrase, JS, phrase)

    def test_the_ladder_lights_only_a_gate_the_members_own_authority_reaches(self):
        self.assertIn("passed !== null && i < passed", JS)
        self.assertIn("C.authorityOf(prof.data, canon)", JS)

    def test_type_floor_and_no_card_classes(self):
        sizes = [int(x) for x in re.findall(r"font-size:(\d+)px", JS)]
        self.assertTrue(sizes and all(s >= 12 for s in sizes), sizes)
        self.assertNotRegex("".join(re.findall(r"'\.ocw[^{]*\{", JS)), r"card")

    def test_it_declares_itself_once(self):
        self.assertIn("if (window.__omegaCommandWall) return;", JS)
        self.assertEqual(len(re.findall(r"window\.__omegaCommandWall\s*=\s*1", JS)), 1)


if __name__ == "__main__":
    unittest.main()
