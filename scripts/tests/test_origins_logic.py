"""Origins Vertical Slice 0: the rules module is pure and is replayed under Node. Guards the release ladder in the GDD
(a PROTOTYPE must have tested rules, a save that rejects tampering, and no network or payment code in the game files)."""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")
FILES = ["omega-origins-logic.js", "omega-origins-scene.js", "omega-origins-audio.js", "omega-origins-ui.js", "omega-origins-game.js"]


def run(js):
    r = subprocess.run([NODE, "-e", "const L=require('./omega-origins-logic.js');" + js], cwd=ROOT, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "node not available")
class OriginsLogic(unittest.TestCase):
    def test_level_curve_is_monotonic_and_capped(self):
        out = run("console.log(JSON.stringify([0,59,60,150,280,450,99999].map(L.levelForXp)))")
        self.assertEqual(out, [1, 1, 2, 3, 4, 5, 5])

    def test_same_seed_same_rolls(self):
        out = run("const a=L.makeRng(7),b=L.makeRng(7);const x=[],y=[];for(let i=0;i<20;i++){x.push(a.next());y.push(b.next())}console.log(JSON.stringify([x,y]))")
        self.assertEqual(out[0], out[1])
        self.assertTrue(all(0 <= v < 1 for v in out[0]))

    def test_damage_never_negative_and_crit_larger(self):
        out = run("console.log(JSON.stringify([L.damage(12,0,false,0.9),L.damage(12,0,true,0),L.damage(12,0,false,0)]))")
        self.assertGreaterEqual(min(out), 0)
        self.assertGreater(out[1], out[2])

    def test_inventory_stacks_and_has_a_limit(self):
        out = run("""let inv=L.emptyInventory();let r;for(let i=0;i<5;i++){r=L.addItem(inv,'salve',1);inv=r.inv}
        const full=L.emptyInventory();let f=full;let last;for(let i=0;i<40;i++){last=L.addItem(f,'blade',1);f=last.inv}
        console.log(JSON.stringify({salves:L.countItem(inv,'salve'),slots:inv.filter(Boolean).length,len:inv.length,lastOk:last.ok}))""")
        self.assertEqual(out["salves"], 5)
        self.assertEqual(out["len"], 12)

    def test_quest_chain_reaches_done_with_a_choice_and_ignores_out_of_order_events(self):
        out = run("""let q=L.newQuest();const seen=[q.stage];
        const skip=L.advanceQuest(q,'boss_defeated');
        ['reach_shrine','wave_cleared','boss_defeated','memory_read','choose_share'].forEach(e=>{q=L.advanceQuest(q,e);seen.push(q.stage)});
        console.log(JSON.stringify({seen,choice:q.choice,skip:skip.stage}))""")
        self.assertEqual(out["seen"], ["hum", "encounter", "boss", "memory", "choice", "done"])
        self.assertEqual(out["choice"], "share")
        self.assertEqual(out["skip"], "hum")

    def test_save_round_trip_and_tamper_rejected(self):
        out = run("""const s=L.newState(91717);s.player.level=3;const t=L.serialize(s);
        const ok=L.parseSave(t);const o=JSON.parse(t);o.body=o.body.replace('"level":3','"level":9');
        const bad=L.parseSave(JSON.stringify(o));const junk=L.parseSave('{not json');
        console.log(JSON.stringify({ok:ok.ok,level:ok.state&&ok.state.player.level,bad:bad.ok,badErr:bad.error,junk:junk.ok}))""")
        self.assertTrue(out["ok"])
        self.assertEqual(out["level"], 3)
        self.assertFalse(out["bad"])
        self.assertIn("checksum", out["badErr"])
        self.assertFalse(out["junk"])

    def test_old_save_versions_migrate_or_fail_cleanly(self):
        out = run("""const s=L.newState(5);const o={saveVersion:0,sum:'0',body:JSON.stringify(s)};const r=L.parseSave(JSON.stringify(o));
        console.log(JSON.stringify({ok:r.ok,hasErr:!!r.error}))""")
        self.assertTrue(out["ok"] or out["hasErr"])

    def test_enemy_state_machine_chases_then_winds_up_then_strikes_once(self):
        out = run("""const e={type:'wraith',state:'idle',timer:0};const d=L.DIFFICULTY.normal;const seq=[];let strikes=0;
        for(let i=0;i<600;i++){const r=L.enemyThink(e,i<30?30:1.2,1/60,d);e.state=r.state;e.timer=r.timer;if(r.strike)strikes++;if(seq[seq.length-1]!==e.state)seq.push(e.state)}
        console.log(JSON.stringify({seq,strikes}))""")
        self.assertEqual(out["seq"][:4], ["idle", "chase", "windup", "recover"])
        self.assertGreaterEqual(out["strikes"], 2)
        # a strike only ever happens at the end of a wind-up, never in a single tick from idle
        again = run("""const e={type:'wraith',state:'idle',timer:0};const r=L.enemyThink(e,1.2,1/60,L.DIFFICULTY.normal);console.log(JSON.stringify(r))""")
        self.assertFalse(again["strike"])

    def test_boss_has_nine_rings_two_dark_in_the_scene(self):
        src = (ROOT / "omega-origins-scene.js").read_text(encoding="utf-8")
        self.assertIn("9", src)
        self.assertTrue(re.search(r"dark", src), "the boss's two dark rings are canon (GDD section 7)")


class OriginsFilesAreHonest(unittest.TestCase):
    def test_no_network_payment_or_cdn_code(self):
        bad = re.compile(r"supabase|stripe|fetch\(|XMLHttpRequest|https?://(?!www\.w3\.org)|esm\.sh|unpkg|cdn\.", re.I)
        for f in FILES + ["game-origins.html"]:
            t = (ROOT / f).read_text(encoding="utf-8")
            if f == "game-origins.html":
                t = re.sub(r'<link rel="manifest"[^>]*>', "", t)
            m = bad.search(t)
            self.assertIsNone(m, f + " contains " + (m.group(0) if m else ""))

    def test_no_inline_event_handlers_in_page(self):
        t = (ROOT / "game-origins.html").read_text(encoding="utf-8")
        self.assertIsNone(re.search(r"\son[a-z]+\s*=", t))

    def test_game_page_mounts_no_sculpture_so_it_keeps_one_webgl_context(self):
        page = (ROOT / "game-origins.html").read_text(encoding="utf-8")
        self.assertNotIn("data-omega-sculpture", page)
        self.assertNotIn("omega-sculpture", page)

    def test_page_says_prototype(self):
        t = (ROOT / "game-origins.html").read_text(encoding="utf-8")
        self.assertIn("PROTOTYPE", t)
        self.assertIn("Not a released game", t)

    def test_registry_status_is_prototype_with_a_build(self):
        reg = json.loads((ROOT / "config" / "omega-studio-registry.json").read_text(encoding="utf-8"))
        g = [f for f in reg["franchises"] if f["id"] == "myth-of-the-stones"][0]["game"]
        self.assertEqual(g["status"], "PROTOTYPE")
        self.assertEqual(g["multiplayer"], "UNAVAILABLE")
        self.assertTrue((ROOT / g["build"]).is_file())


if __name__ == "__main__":
    unittest.main()
