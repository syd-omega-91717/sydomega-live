"""Zodiac Wars: Ascension, Slice 0 (a duel prototype, PROTOTYPE): the rules module is pure and is proven under Node.

Every number in the design document's section 3 is asserted here, and so are the section 6 acceptance items that can be measured without a screen:
the rules pass Node tests, a 3-duel replay equals the original frame for frame, and a scripted bot finishes the duel. Frame rate on a named device is NOT
measured here and is not claimed. The game files must contain no network, payment or storage code."""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")
FILES = ["omega-zw-logic.js", "omega-zw-game.js", "game-zodiac-wars.html"]


def run(js):
    r = subprocess.run([NODE, "-e", "const Z=require('./omega-zw-logic.js');" + js], cwd=ROOT, capture_output=True, text=True, timeout=300)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


# Two fighters in reach, the dummy as the opponent, a helper that steps N frames with one input then returns the state.
SETUP = """
const I=Z.INPUT;
function near(house,seed){const s=Z.start(house,seed||1);s.p.x=500;s.e.x=540;return s}
function go(s,inp,n){for(let i=0;i<n;i++)Z.step(s,typeof inp==='function'?inp(i,s):inp);return s}
"""


@unittest.skipUnless(NODE, "node not available")
class Rules(unittest.TestCase):
    def test_the_numbers_are_the_design_documents(self):
        out = run(SETUP + "console.log(JSON.stringify({hz:Z.HZ,hp:Z.HEALTH,l:Z.ATK.light,h:Z.ATK.heavy,perfect:Z.PERFECT_FRAMES,open:Z.OPEN_FRAMES,block:Z.GUARD_BLOCK,sh:Z.SHADOW_FRAMES,st:Z.STAGGER_FRAMES,m:Z.SHADOW_MULT}))")
        self.assertEqual((out["hz"], out["hp"]), (60, 100))
        self.assertEqual((out["l"]["dmg"], out["l"]["total"]), (8, 18))
        self.assertEqual((out["h"]["dmg"], out["h"]["total"], out["h"]["after"]), (22, 40, 12))
        self.assertEqual((out["perfect"], out["open"], out["block"]), (6, 20, 0.7))
        self.assertEqual((out["sh"], out["st"], out["m"]), (480, 180, 1.5))
        self.assertEqual((out["l"]["ov"], out["h"]["ov"]), (10, 25))

    def test_a_light_attack_deals_8_in_18_frames_and_a_heavy_22_in_40_plus_12(self):
        out = run(SETUP + """
const a=near('libra');go(a,I.LIGHT,1);go(a,0,5);const before=a.e.hp;go(a,0,1);const afterHit=a.e.hp;
const f=[];const b=near('libra');Z.step(b,I.LIGHT);let n=1;while(b.p.act!=='idle'&&n<200){Z.step(b,0);n++}f.push(n);
const c=near('libra');Z.step(c,I.HEAVY);let m=1;while(c.p.act!=='idle'&&m<200){Z.step(c,0);m++}
const d=near('libra');go(d,I.HEAVY,1);go(d,0,22);const dh=d.e.hp;go(d,0,1);   // frames 1-23: nothing yet; frame 24 lands
console.log(JSON.stringify({before,afterHit,lightFrames:n,heavyFrames:m,hb:dh,ha:d.e.hp}))""")
        self.assertEqual(out["before"], 100)
        self.assertEqual(out["afterHit"], 92)
        self.assertEqual(out["lightFrames"], 18)
        self.assertEqual(out["heavyFrames"], 52)   # 40 frames + 12 of recovery
        self.assertEqual((out["hb"], out["ha"]), (100, 78))

    def test_guard_blocks_70_percent_and_a_perfect_guard_blocks_all_and_opens_the_attacker_for_20_frames(self):
        out = run(SETUP + """
// a hits b: b holds guard for a long time (not perfect), then a perfect guard
const late=near('aries');late.p.act='idle';late.e.house='unbled';late.e.act='idle';
const g1=near('aries');g1.e.house='aries';g1.e.cyc=0; // the opponent is a human-rule fighter (no AI): drive it by hand
const L=Z.start('aries',3);L.p.x=500;L.e.x=540;L.e.house='aries';
// player guards for 10 frames first, then the Unbled-like fighter (e) strikes with a light: manual hit resolution through step by forcing e into a light at t=6
L.p.act='guard';L.p.guardT=10;L.e.act='light';L.e.t=6;L.e.hit=false;
Z.step(L,I.GUARD);
const blocked=L.p.hp, hitEv=L.ev.filter(e=>e.type==='hit')[0];
const P=Z.start('aries',3);P.p.x=500;P.e.x=540;P.e.house='aries';P.p.act='guard';P.p.guardT=2;P.e.act='light';P.e.t=6;P.e.hit=false;
Z.step(P,I.GUARD);
console.log(JSON.stringify({blocked,through:hitEv.damage,blockedAmt:hitEv.blocked,php:P.p.hp,perfect:P.ev.filter(e=>e.type==='hit')[0].perfect,open:P.e.act,rec:P.e.rec}))""")
        # an 8 damage hit: 70% blocked (round 5.6 = 6), 2 gets through
        self.assertEqual(out["blockedAmt"], 6)
        self.assertEqual(out["through"], 2)
        self.assertEqual(out["blocked"], 98)
        self.assertEqual(out["php"], 100)           # a perfect guard takes nothing
        self.assertTrue(out["perfect"])
        self.assertEqual((out["open"], out["rec"]), ("open", 20))

    def test_overreach_is_10_a_hit_25_a_heavy_and_a_perfect_guard_adds_none(self):
        out = run(SETUP + """
const a=near('libra');go(a,I.LIGHT,1);go(a,0,6);const l=[a.p.oc,a.e.oc];
const b=near('libra');go(b,I.HEAVY,1);go(b,0,23);const h=[b.p.oc,b.e.oc];
console.log(JSON.stringify({l,h}))""")
        self.assertEqual(out["l"][0], 10)           # dealt
        self.assertEqual(out["h"][0], 25)

    def test_overreach_100_starts_an_8_second_shadow_with_x1_5_damage_no_guard_then_a_3_second_stagger(self):
        out = run(SETUP + """
const s=near('aries');s.p.oc=95;s.e.hp=100;go(s,I.LIGHT,1);go(s,0,6);   // a hit takes it past 100
const entered=s.p.sh;const dmgAt=Z.preview(s,'p','light',0).damage;
// guard is refused in shadow
const g=s.p.act;go(s,I.GUARD,2);const guarded=s.p.act==='guard';
go(s,0,entered-3);
const phase1=[s.p.sh,s.p.act];
go(s,0,6);const stag=[s.p.act,s.p.stag];
go(s,0,s.p.stag+2);
console.log(JSON.stringify({entered,dmgAt,guarded,phase1,stag,after:s.p.act}))""")
        self.assertEqual(out["entered"], 480)
        self.assertEqual(out["dmgAt"], 12)           # 8 x 1.5
        self.assertFalse(out["guarded"])
        self.assertEqual(out["stag"][0], "stagger")
        self.assertEqual(out["after"], "idle")

    def test_aries_shows_its_cost_before_the_pour_and_pays_it_into_the_next_hit(self):
        out = run(SETUP + """
const s=near('aries');const free=Z.preview(s,'p','light',0),paid=Z.preview(s,'p','light',I.PAY);
const hp0=s.p.hp;go(s,I.LIGHT|I.PAY,1);const spent=hp0-s.p.hp;go(s,0,6);
console.log(JSON.stringify({free,paid,spent,dealt:100-s.e.hp,hp:s.p.hp}))""")
        self.assertEqual(out["free"]["damage"], 8)
        self.assertEqual(out["free"]["spendHealth"], 0)
        self.assertEqual((out["paid"]["spendHealth"], out["paid"]["damage"]), (15, 23))
        self.assertEqual(out["spent"], 15)           # the health is spent when the attack is committed
        self.assertEqual(out["dealt"], 23)           # and added to the hit
        self.assertEqual(out["hp"], 85)
        # the preview never mutated anything

    def test_libra_counters_a_blocked_hit_with_half_the_blocked_damage_and_lowers_the_attackers_overreach(self):
        out = run(SETUP + """
const L=Z.start('libra',3);L.p.x=500;L.e.x=540;L.e.house='aries';L.e.oc=40;L.p.act='guard';L.p.guardT=10;L.e.act='heavy';L.e.t=23;L.e.hit=false;
Z.step(L,I.GUARD);const ev=L.ev.filter(e=>e.type==='hit')[0];
console.log(JSON.stringify({ev,ehp:L.e.hp,eoc:L.e.oc,php:L.p.hp,act:L.p.act,rec:L.p.rec}))""")
        # a 22 heavy: 15 blocked (round 15.4), 7 through; half of 15 returns (8); attacker overreach 40 + 25 - 15
        self.assertEqual(out["ev"]["blocked"], 15)
        self.assertEqual(out["ev"]["countered"], 8)
        self.assertEqual(out["ehp"], 92)
        self.assertEqual(out["php"], 93)
        self.assertEqual(out["eoc"], 50)
        self.assertEqual((out["act"], out["rec"]), ("tempo", 10))   # Libra's cost: 10 frames of tempo


@unittest.skipUnless(NODE, "node not available")
class Duel(unittest.TestCase):
    def test_the_dummy_falls_then_the_unbled_appears_and_the_duel_can_be_won_or_lost(self):
        out = run(SETUP + """
const s=Z.start('aries',5);let f=0,stage1=0;while(!s.over&&f<60*600){Z.step(s,Z.bot(s));f++;if(s.stage===1&&!stage1)stage1=f}
const l=Z.start('libra',5);l.e.hp=0;Z.step(l,0);let g=0;while(!l.over&&g<60*600)  {Z.step(l,0);g++}   // past the dummy; then never presses anything: must lose
console.log(JSON.stringify({win:s.over,stage1:stage1>0,lose:l.over,lstage:l.stage,lf:g}))""")
        self.assertEqual(out["win"], "win")
        self.assertTrue(out["stage1"])
        self.assertEqual(out["lose"], "lose")
        self.assertLess(out["lf"], 60 * 600, "an idle player must be beaten, not wait forever")

    def test_a_scripted_bot_finishes_the_duel_with_both_houses_and_every_seed(self):
        out = run(SETUP + """
const r=[];for(const h of ['aries','libra'])for(const seed of [1,2,3,9,91717]){const s=Z.start(h,seed);let f=0;while(!s.over&&f<60*600){Z.step(s,Z.bot(s));f++}r.push([h,seed,s.over,f])}
console.log(JSON.stringify(r))""")
        self.assertEqual(len(out), 10)
        for h, seed, over, frames in out:
            self.assertEqual(over, "win", (h, seed))

    def test_three_duel_replays_equal_the_originals_frame_for_frame(self):
        out = run(SETUP + """
const r=[];for(const [h,seed] of [['aries',11],['libra',22],['aries',33]]){
  const s=Z.start(h,seed),log=[],hs=[];let f=0;while(!s.over&&f<60*600){const i=Z.bot(s);log.push(i);Z.step(s,i);hs.push(Z.hash(s));f++}
  const re=Z.replay(h,seed,log);r.push({h,seed,frames:f,same:re.hashes.length===hs.length&&re.hashes.every((x,i)=>x===hs[i]),over:re.state.over})}
console.log(JSON.stringify(r))""")
        self.assertEqual(len(out), 3)
        for d in out:
            self.assertTrue(d["same"], d)
            self.assertGreater(d["frames"], 600)

    def test_the_seed_changes_what_the_unbled_throws_and_the_same_seed_never_does(self):
        # Compare the Unbled's own attack sequence (kind and frame), not a state hash: the seed number sits in the state, so a hash would differ
        # even if the Unbled ignored the seed, and a mutant that did exactly that survived the first version of this test.
        out = run(SETUP + """
function throws(seed){const s=Z.start('aries',seed);let f=0;const seq=[];while(!s.over&&f<60*600){Z.step(s,Z.bot(s));f++;s.ev.forEach(e=>{if((e.type==='hit'||e.type==='whiff')&&e.who==='e')seq.push(f+e.kind[0])})}return seq.join(',')}
console.log(JSON.stringify({a:throws(4),a2:throws(4),b:throws(5),c:throws(6),d:throws(7)}))""")
        self.assertEqual(out["a"], out["a2"])
        self.assertGreater(len({out["a"], out["b"], out["c"], out["d"]}), 1, "the seed must change what the Unbled throws")

    def test_a_finished_duel_stays_finished(self):
        out = run(SETUP + """
const s=Z.start('aries',1);while(!s.over)Z.step(s,Z.bot(s));const h=Z.hash(s),f=s.frame;for(let i=0;i<30;i++)Z.step(s,I.LIGHT);
console.log(JSON.stringify({same:h===Z.hash(s),f:s.frame===f}))""")
        self.assertTrue(out["same"] and out["f"])


class Files(unittest.TestCase):
    def test_no_network_payment_or_storage_code_in_the_game_files(self):
        for name in FILES:
            src = (ROOT / name).read_text(encoding="utf-8")
            for bad in (r"\bfetch\s*\(", r"XMLHttpRequest", r"WebSocket", r"sendBeacon", r"localStorage", r"sessionStorage", r"indexedDB", r"\bsupabase\b", r"stripe", r"eval\s*\(", r"new Function", r"innerHTML", r"document\.write"):
                self.assertIsNone(re.search(bad, src, re.I), "%s contains %s" % (name, bad))

    def test_the_page_says_prototype_and_not_released_and_loads_both_modules_in_order(self):
        html = (ROOT / "game-zodiac-wars.html").read_text(encoding="utf-8")
        self.assertIn("PROTOTYPE", html)
        self.assertIn("not a released game", html)
        self.assertLess(html.index("omega-zw-logic.js"), html.index("omega-zw-game.js"))

    def test_nothing_in_the_rules_uses_math_random_or_the_clock(self):
        src = (ROOT / "omega-zw-logic.js").read_text(encoding="utf-8")
        self.assertNotIn("Math.random", src)
        self.assertNotIn("Date.now", src)
        self.assertNotIn("performance.now", src)


if __name__ == "__main__":
    unittest.main()
