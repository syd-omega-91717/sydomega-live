"""The Two-Hand Bridge (a puzzle level, PROTOTYPE): the rules module is pure and is proven under Node.

Guards: every level is solvable and its par is the solver's true minimum; every pair of cradles is needed (a decorative pair is a
bug the first draft of this level set actually had); no level can be beaten with every pair disabled; a recorded solution replays
to a win; each rule (heavy cannot cross a thread, one hand opens nothing, an opened span stays open, undo, win freezes the board)
holds; and the game files contain no network, payment or storage-of-anything-but-progress code."""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")
FILES = ["omega-bridge-logic.js", "omega-bridge-game.js"]


def run(js):
    r = subprocess.run([NODE, "-e", "const L=require('./omega-bridge-logic.js');" + js], cwd=ROOT, capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


# A tiny arena for rule tests: Auren (@) and Torin (&) on the left, a thread, a span, and a far side with the stone (this is level I).
ARENA = ["###########", "#...AAA...#", "#.@a===a*.#", "#.&.   ...#", "###########"]
ARENA_JS = "const A=" + json.dumps({"id": "t", "rows": ARENA}) + ";"


@unittest.skipUnless(NODE, "node not available")
class BridgeLogic(unittest.TestCase):
    def test_every_level_is_solvable_with_the_stored_par_and_the_solution_replays(self):
        out = run("""const o=L.LEVELS.map(l=>{const r=L.solve(l),g=L.replay(l,r.actions);return {id:l.id,par:l.par,solver:r.moves,won:g.state.won,moves:g.state.moves}});console.log(JSON.stringify(o))""")
        self.assertEqual(len(out), 10)
        for lv in out:
            self.assertEqual(lv["par"], lv["solver"], lv["id"])
            self.assertTrue(lv["won"], lv["id"])
            self.assertEqual(lv["moves"], lv["par"], lv["id"])

    def test_every_pair_is_needed_and_no_level_is_beaten_without_pairs(self):
        out = run("""const o=L.LEVELS.map(l=>{const p=L.parse(l);return {id:l.id,pairs:p.letters.length,
          needed:p.letters.map(k=>L.solve(l,{disable:k})===null),none:L.solve(l,{disable:p.letters.join('')})===null}});console.log(JSON.stringify(o))""")
        for lv in out:
            self.assertGreaterEqual(lv["pairs"], 1, lv["id"])
            self.assertTrue(all(lv["needed"]), "%s has a decorative pair" % lv["id"])
            self.assertTrue(lv["none"], "%s can be beaten with every pair disabled" % lv["id"])

    def test_each_chapter_ramps_up_and_chapter_two_is_the_deeper_one(self):
        out = run("console.log(JSON.stringify(L.LEVELS.map(l=>({c:l.chapter,par:l.par,pairs:L.parse(l).letters.length,w:L.parse(l).w,h:L.parse(l).h}))))")
        self.assertEqual(len(out), 10)
        for ch in (1, 2):
            lv = [x for x in out if x["c"] == ch]
            self.assertEqual(len(lv), 5, "chapter %d" % ch)
            pars = [x["par"] for x in lv]
            self.assertEqual(pars, sorted(pars), "chapter %d must not get easier" % ch)
        ch1, ch2 = [x for x in out if x["c"] == 1], [x for x in out if x["c"] == 2]
        self.assertEqual(max(x["pairs"] for x in ch1), 3)
        self.assertTrue(all(x["pairs"] >= 2 for x in ch2), "every chapter II level needs at least two spans")
        self.assertGreater(min(x["par"] for x in ch2), 30, "chapter II starts well above the tutorial")
        self.assertEqual(out[-1]["par"], max(x["par"] for x in out))

    def test_every_level_fits_a_phone_width_and_the_level_ids_are_unique(self):
        out = run("console.log(JSON.stringify(L.LEVELS.map(l=>({id:l.id,w:L.parse(l).w,h:L.parse(l).h}))))")
        self.assertEqual(len({x["id"] for x in out}), len(out))
        for x in out:
            self.assertLessEqual(x["w"], 24, x["id"])   # 24 columns is 12 px tiles at 375 px; wider would be unreadable
            self.assertLessEqual(x["h"], 6, x["id"])

    def test_a_chapter_two_level_really_needs_both_characters_to_swap_several_times(self):
        out = run("console.log(JSON.stringify(L.LEVELS.filter(l=>l.chapter===2).map(l=>({id:l.id,swaps:(L.solve(l).actions.match(/S/g)||[]).length}))))")
        for x in out:
            self.assertGreaterEqual(x["swaps"], 3, x["id"])

    # ARENA coordinates (column, row): Auren (2,2), Torin (2,3); cradle a at (3,2) and (7,2); thread (4..6,2); span A (4..6,1); stone (8,2).
    def test_the_heavy_character_cannot_cross_a_thread_and_the_light_one_can(self):
        out = run(ARENA_JS + """const g=L.newGame(A);g.move('R');const heavy=g.move('R');   // Auren: onto the cradle, then onto the thread
          const t=L.newGame(A);t.swap();t.move('R');t.move('U');const light=t.move('R');   // Torin: (3,3) -> cradle (3,2) -> thread (4,2)
          console.log(JSON.stringify({heavy:[heavy.moved,heavy.blocked],light:[light.moved,light.blocked]}))""")
        self.assertEqual(out["heavy"], [False, "too-heavy"])
        self.assertEqual(out["light"], [True, None])

    def test_one_hand_opens_nothing(self):
        out = run(ARENA_JS + """const g=L.newGame(A);g.move('R');console.log(JSON.stringify({open:g.state.open.a,onCradle:g.state.a===L.parse(A).pairs.a[0]}))""")
        self.assertTrue(out["onCradle"])
        self.assertFalse(out["open"])

    def test_a_closed_span_blocks_both_characters(self):
        out = run(ARENA_JS + """const g=L.newGame(A);g.move('U');g.move('R');const r=g.move('R');   // Auren up, right, then onto span tile (4,1)
          console.log(JSON.stringify([r.moved,r.blocked]))""")
        self.assertEqual(out, [False, "closed"])

    def test_two_hands_open_the_span_and_it_stays_open_after_they_let_go(self):
        # Torin crosses the thread to the far cradle, Auren steps onto the near cradle: that is the opening.
        out = run(ARENA_JS + """const g=L.newGame(A);
          g.swap();['R','U','R','R','R','R'].forEach(d=>g.move(d));   // Torin to the far cradle (7,2)
          const beforeAuren=g.state.open.a;
          g.swap();const r=g.move('R');                                // Auren onto the near cradle (3,2)
          const opened=g.state.open.a, letters=r.opened;
          g.move('U');g.move('R');const onSpan=g.move('R');             // Auren leaves the cradle and walks onto the span
          console.log(JSON.stringify({beforeAuren,opened,letters,onSpan:[onSpan.moved,onSpan.blocked],stillOpen:g.state.open.a}))""")
        self.assertFalse(out["beforeAuren"])
        self.assertTrue(out["opened"])
        self.assertEqual(out["letters"], ["a"])
        self.assertEqual(out["onSpan"], [True, None])
        self.assertTrue(out["stillOpen"], "an opened span must stay open once a character leaves the cradle")

    def test_blocked_moves_cost_nothing_and_swapping_is_free(self):
        out = run(ARENA_JS + """const g=L.newGame(A);g.move('L');const wall=g.move('L');   // (1,2) is floor, (0,2) is a wall
          const afterWall=g.state.moves;g.swap();g.swap();g.swap();
          console.log(JSON.stringify({wall:[wall.moved,wall.blocked],afterWall,afterSwaps:g.state.moves}))""")
        self.assertEqual(out["wall"], [False, "wall"])
        self.assertEqual(out["afterWall"], 1)
        self.assertEqual(out["afterSwaps"], 1)

    def test_you_cannot_step_onto_the_other_character(self):
        out = run(ARENA_JS + """const g=L.newGame(A);const r=g.move('D');console.log(JSON.stringify({moved:r.moved,blocked:r.blocked,moves:g.state.moves}))""")
        self.assertFalse(out["moved"])
        self.assertEqual(out["blocked"], "occupied")
        self.assertEqual(out["moves"], 0)

    def test_the_chasm_and_the_edge_stop_a_walker(self):
        out = run(ARENA_JS + """const g=L.newGame(A);g.swap();g.move('R');g.move('R');   // Torin (3,3) then (4,3), the chasm
          console.log(JSON.stringify(g.move('R').blocked))""")
        self.assertEqual(out, "chasm")

    def test_undo_restores_every_kind_of_step_and_restart_clears_history(self):
        out = run(ARENA_JS + """const g=L.newGame(A);const s0=JSON.stringify(g.state);
          g.move('R');g.swap();g.move('R');
          let n=0;while(g.canUndo){g.undo();n++}
          const same=JSON.stringify(g.state)===s0;g.move('R');g.restart();
          console.log(JSON.stringify({n,same,afterRestart:JSON.stringify(g.state)===s0,canUndo:g.canUndo}))""")
        self.assertEqual(out["n"], 3)
        self.assertTrue(out["same"])
        self.assertTrue(out["afterRestart"])
        self.assertFalse(out["canUndo"])

    def test_step_never_mutates_its_input_and_a_won_board_is_frozen(self):
        out = run(ARENA_JS + """const p=L.parse(A),s=L.initialState(p),before=JSON.stringify(s);L.step(p,s,'R');
          const same=JSON.stringify(s)===before;
          const r=L.solve(A);const g=L.replay(A,r.actions);const after=g.move('L');
          console.log(JSON.stringify({same,won:g.state.won,blocked:after.blocked,moved:after.moved,swap:g.swap()}))""")
        self.assertTrue(out["same"])
        self.assertTrue(out["won"])
        self.assertEqual(out["blocked"], "won")
        self.assertFalse(out["moved"])
        self.assertFalse(out["swap"])

    def test_malformed_levels_are_rejected_loudly(self):
        cases = {
            "odd cradle": ["#####", "#@a&#", "#.A*#", "#####"],
            "no start": ["#####", "#.a.#", "#.A*#", "#####"],
            "unknown tile": ["#####", "#@?&#", "#..*#", "#####"],
            "ragged": ["#####", "#@&*", "#####"],
            "span without cradles": ["#####", "#@&A#", "#..*#", "#####"],
        }
        for name, rows in cases.items():
            out = run("let e=null;try{L.parse({id:'x',rows:%s})}catch(x){e=String(x.message)}console.log(JSON.stringify({e}))" % json.dumps(rows))
            self.assertIsNotNone(out["e"], name)


class BridgeFiles(unittest.TestCase):
    def test_game_files_exist_and_have_no_network_payment_or_html_injection(self):
        for f in FILES:
            src = (ROOT / f).read_text(encoding="utf-8")
            code = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
            code = re.sub(r"(^|\s)//[^\n]*", r"\1", code)
            for bad in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "stripe", "checkout", "innerHTML", "outerHTML", "insertAdjacentHTML", "document.write", "eval(", "new Function"):
                self.assertNotIn(bad, code, "%s uses %s" % (f, bad))

    def test_a_held_key_cannot_fire_steps_and_nothing_flashes(self):
        code = (ROOT / "omega-bridge-game.js").read_text(encoding="utf-8")
        self.assertIn("e.repeat", code)
        self.assertNotIn("setInterval", code)

    def test_the_logic_file_is_pure(self):
        code = (ROOT / "omega-bridge-logic.js").read_text(encoding="utf-8")
        code = re.sub(r"/\*.*?\*/", "", code, flags=re.S)
        for bad in ("document", "localStorage", "setTimeout", "setInterval", "requestAnimationFrame", "Math.random", "Date.now", "navigator"):
            self.assertNotIn(bad, code, "the rules module must stay pure: found " + bad)

    def test_the_page_names_no_unreleased_story_text(self):
        page = (ROOT / "game-origins-bridge.html").read_text(encoding="utf-8").lower()
        for leak in ("malachar", "seraphine", "eryndor", "ithren", "liora", "sundering", "the seven stones", "draven"):
            self.assertNotIn(leak, page)

    def test_help_free_and_no_inline_script(self):
        page = (ROOT / "game-origins-bridge.html").read_text(encoding="utf-8")
        self.assertEqual(len(re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(?!\s*</script>)", page)), 0, "no inline <script> (the CSP ratchet)")


if __name__ == "__main__":
    unittest.main()
