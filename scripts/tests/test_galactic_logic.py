"""LAST GALACTIC EMPIRE, Slice 0 (a grand-strategy game, PROTOTYPE): the rules module is pure and is proven under Node.

These are the GDD's acceptance criteria made executable: (1) the battle resolver against known answers worked out by hand, (2) determinism, the
same seed and actions give the same campaign, (3) the Drift arithmetic, (4) a scripted Court finishes a campaign, plus the explainability
promise (every AI move carries its reason, every battle its breakdown), the endings, the map, supply, saves that refuse tampering, and an
idle Court that loses, so that decisions demonstrably matter."""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")
FILES = ["omega-galactic-logic.js", "omega-galactic-game.js"]


def run(js):
    r = subprocess.run([NODE, "-e", "const G=require('./omega-galactic-logic.js');" + js], cwd=ROOT, capture_output=True, text=True, timeout=300)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "node not available")
class GalacticLogic(unittest.TestCase):
    def test_a_battle_is_the_same_arithmetic_every_time_known_answer_one_the_home_fleet_that_counters_the_doctrine(self):
        # A: strength 10, readiness 100, guard, in supply, at home. B: strength 10, 100, assault, in supply, away.
        # A: 10 x 100 x 100 x 125 (guard beats assault) x 120 (home) / 1e7 = 15.0 ; B: 10 x 100 x 100 x 80 x 100 / 1e7 = 8.0 ; share floor(150*100/230) = 65.
        out = run("""const f=(id,doc)=>({id,str:10,ready:100,doc});
          const r=G.resolveBattle({f:'C',fleets:[f(1,'guard')],supplied:true,home:true},{f:'I',fleets:[f(2,'assault')],supplied:true,home:false});
          console.log(JSON.stringify({w:r.winner,p:r.powers,share:r.share,loss:r.losses,lines:r.lines.length}))""")
        self.assertEqual(out["w"], "C")
        self.assertEqual(out["p"], {"w": 150, "l": 80})
        self.assertEqual(out["share"], 65)
        self.assertEqual(out["loss"], {"1": 1, "2": 7})          # winner floor(10*35/200)=1 ; loser ceil(10*65/100)=7
        self.assertEqual(out["lines"], 2)

    def test_known_answer_two_a_big_tired_unsupplied_fleet_loses_to_a_small_fresh_supplied_one(self):
        # A: 12 x 50% x 70% x 100 x 100 / 1e7 -> 42 (4.2) ; B: 6 x 100 x 100 x 100 x 100 / 1e7 -> 60 (6.0) ; B wins, share floor(6000/102)=58.
        out = run("""const r=G.resolveBattle({f:'C',fleets:[{id:1,str:12,ready:50,doc:'screen'}],supplied:false,home:false},{f:'R',fleets:[{id:2,str:6,ready:100,doc:'screen'}],supplied:true,home:false});
          console.log(JSON.stringify({w:r.winner,p:r.powers,share:r.share,loss:r.losses}))""")
        self.assertEqual(out["w"], "R")
        self.assertEqual(out["p"], {"w": 60, "l": 42})
        self.assertEqual(out["share"], 58)
        self.assertEqual(out["loss"], {"1": 7, "2": 1})

    def test_doctrines_form_a_cycle_and_a_tie_goes_to_the_home_side(self):
        out = run("""const mk=(doc)=>({id:1,str:10,ready:100,doc});
          const a=G.fleetPower(mk('guard'),true,'assault',false),b=G.fleetPower(mk('assault'),true,'screen',false),c=G.fleetPower(mk('screen'),true,'guard',false);
          const d=G.fleetPower(mk('guard'),true,'screen',false);
          const t=G.resolveBattle({f:'C',fleets:[{id:1,str:10,ready:100,doc:'screen'}],supplied:true,home:true},{f:'R',fleets:[{id:2,str:10,ready:100,doc:'screen'}],supplied:true,home:false});
          const t2=G.resolveBattle({f:'R',fleets:[{id:2,str:10,ready:100,doc:'screen'}],supplied:true,home:false},{f:'C',fleets:[{id:1,str:10,ready:100,doc:'screen'}],supplied:true,home:false});
          console.log(JSON.stringify({cycle:[a,b,c],worse:d,home:t.winner,noHome:t2.winner}))""")
        self.assertEqual(out["cycle"], [125, 125, 125])           # guard beats assault, assault beats screen, screen beats guard: all 12.5
        self.assertEqual(out["worse"], 80)                        # guard against screen is the countered side: 8.0
        self.assertEqual(out["home"], "C")
        self.assertEqual(out["noHome"], "C", "with no home side a tie goes to the lower faction letter (C before R), so it never depends on argument order")

    def test_the_map_is_connected_has_three_capitals_and_every_system_is_reachable_within_the_graph(self):
        out = run("""const seen=new Set([0]),q=[0];while(q.length){const c=q.shift();for(const n of G.ADJ[c])if(!seen.has(n)){seen.add(n);q.push(n)}}
          const g=G.newGame(1);const own={};g.owner.forEach(o=>own[o]=(own[o]||0)+1);
          console.log(JSON.stringify({n:G.SYSTEMS.length,reach:seen.size,own,caps:Object.values(G.CAPITAL).map(c=>g.owner[c]),minDeg:Math.min(...G.ADJ.map(a=>a.length)),sym:G.ADJ.every((a,i)=>a.every(n=>G.ADJ[n].includes(i)))}))""")
        self.assertEqual((out["n"], out["reach"]), (20, 20))
        self.assertEqual(out["own"], {"C": 7, "R": 5, "I": 6, "N": 2})
        self.assertEqual(out["caps"], ["C", "R", "I"])
        self.assertGreaterEqual(out["minDeg"], 2)
        self.assertTrue(out["sym"])

    def test_supply_follows_ownership_back_to_the_capital_and_a_lost_capital_has_none(self):
        out = run("""const g=G.newGame(1);const s0=Object.keys(G.supplySet(g,'C')).map(Number);
          g.owner[1]='R';const s1=Object.keys(G.supplySet(g,'C')).map(Number);
          g.owner[0]='R';const s2=Object.keys(G.supplySet(g,'C'));
          console.log(JSON.stringify({s0,has1:s1.includes(1),has2:s1.includes(2),none:s2.length}))""")
        self.assertEqual(sorted(out["s0"]), [0, 1, 2, 3, 4, 5, 6])
        self.assertFalse(out["has1"])
        self.assertTrue(out["has2"])
        self.assertEqual(out["none"], 0)

    def test_drift_is_two_a_standing_law_plus_one_a_grievance_less_one_every_season(self):
        out = run("""const rows=[],order=['levy','courts','tithe','registry','charter'];
          const stack=(g)=>{const a=G.bot(g);a.decree=order[g.season]||null;a.answer=0;return a};     // defend as the scripted Court does, but enact every law one a season and answer no grievance
          for(const seed of [3,91717,424242]){for(const ch of [G.naive,stack]){const g=G.play(seed,x=>ch(x));let prev=20;g.history.forEach(h=>{rows.push([prev,h.laws,h.open,h.drift]);prev=h.drift})}}
          console.log(JSON.stringify(rows))""")
        self.assertGreater(len(out), 15)
        self.assertGreaterEqual(max(r[1] for r in out), 4, "the sample must include four or more standing laws at once")
        self.assertTrue(any(r[2] > 0 for r in out), "and open grievances")
        for prev, laws, open_, now in out:
            self.assertEqual(now, max(0, min(100, prev + 2 * laws + open_ - 1)), (prev, laws, open_, now))

    def test_the_same_seed_and_actions_give_the_same_campaign_and_a_saved_plan_replays_exactly(self):
        out = run("""const a=G.play(91717,G.bot),b=G.play(91717,G.bot),c=G.play(91718,G.bot),r=G.replay(91717,a.plan);
          console.log(JSON.stringify({same:JSON.stringify(a)===JSON.stringify(b),replay:JSON.stringify(r.game)===JSON.stringify(a),err:r.error||null,
            diff:JSON.stringify(a.log)!==JSON.stringify(c.log),sum:G.checksum(91717,a.plan)===G.checksum(91717,b.plan)}))""")
        self.assertTrue(out["same"] and out["replay"] and out["sum"])
        self.assertIsNone(out["err"])

    def test_a_tampered_save_changes_its_checksum_and_a_bad_action_stops_the_replay_at_that_season(self):
        out = run("""const a=G.play(5,G.bot),t=JSON.parse(JSON.stringify(a.plan));t[2].reinforce=[1,2,3,1];
          const bad=a.plan.slice();bad[1]={decree:'nope',orders:[],doctrines:[],reinforce:[],answer:0};
          const r=G.replay(5,bad);console.log(JSON.stringify({changed:G.checksum(5,t)!==G.checksum(5,a.plan),at:r.at,err:r.error}))""")
        self.assertTrue(out["changed"])
        self.assertEqual(out["at"], 1)
        self.assertEqual(out["err"], "Unknown law.")

    def test_invalid_orders_are_refused_and_change_nothing(self):
        out = run("""const g=G.newGame(2),before=JSON.stringify(g),E=(a)=>G.applySeason(g,a).error||null;
          console.log(JSON.stringify({far:E({orders:[{fleet:1,to:19}]}),enemy:E({orders:[{fleet:4,to:7}]}),twice:E({orders:[{fleet:1,to:1},{fleet:1,to:2}]}),
            poor:E({reinforce:[1,2,3]}),veto:E({decree:'veto'}),doc:E({doctrines:[{fleet:1,doc:'nope'}]}),grv:E({answer:1}),ok:E({}),untouched:JSON.stringify(g)===before}))""")
        self.assertEqual(out["far"], "A fleet moves one jump a season.")
        self.assertEqual(out["enemy"], "You can only order your own fleets.")
        self.assertEqual(out["twice"], "A fleet can take one order a season.")
        self.assertIn("treasury holds", out["poor"])
        self.assertIn("must trust the Court", out["veto"])
        self.assertEqual(out["doc"], "Bad doctrine order.")
        self.assertEqual(out["grv"], "There are not that many open grievances.")
        self.assertIsNone(out["ok"])
        self.assertTrue(out["untouched"])

    def test_every_ai_order_carries_a_reason_and_hostile_factions_name_the_trust_that_drives_them(self):
        out = run("""const g=G.newGame(9);const all=[].concat(G.aiOrders(g,'R'),G.aiOrders(g,'I'));
          const ind=G.aiOrders(g,'I');const adv=ind.filter(o=>o.to!==g.fleets.find(f=>f.id===o.fleet).at);
          console.log(JSON.stringify({n:all.length,reasons:all.every(o=>typeof o.reason==='string'&&o.reason.length>10),adv:adv.map(o=>o.reason)}))""")
        self.assertEqual(out["n"], 5)
        self.assertTrue(out["reasons"])
        self.assertTrue(out["adv"], "the hostile Independent Worlds advance on the first season")
        for r in out["adv"]:
            self.assertRegex(r, r"trust in the Court is 30 \(below 40\): advancing on")

    def test_the_ai_commits_its_orders_before_the_court_acts_so_a_doctrine_flip_can_outguess_it(self):
        # The AI picks the doctrine that beats the defenders' CURRENT doctrine. The Court can flip first and beat that answer.
        out = run("""const g=G.newGame(1);
          const orders=G.aiOrders(g,'I').concat(G.aiOrders(g,'R'));
          const counter=orders.filter(o=>o.doc&&/the defenders are on/.test(o.reason));
          console.log(JSON.stringify({docs:[...new Set(counter.map(o=>o.doc))],n:counter.length,beats:G.COUNTERS}))""")
        for d in out["docs"]:
            self.assertEqual(out["beats"][d], "guard", "against a guard defender the AI answers with screen")

    def test_a_scripted_court_that_manages_doctrines_finishes_and_wins_and_an_idle_court_loses(self):
        out = run("""const N=120,res={bot:{},naive:{},idle:{}};
          for(let i=1;i<=N;i++){for(const [k,fn] of [['bot',G.bot],['naive',G.naive],['idle',G.idle]]){const g=G.play(i*7919+91717,fn);res[k][g.ending]=(res[k][g.ending]||0)+1}}
          console.log(JSON.stringify(res))""")
        n = 120
        self.assertGreaterEqual(out["bot"].get("stable-peace", 0) / n, 0.93)
        self.assertLessEqual(out["idle"].get("stable-peace", 0) / n, 0.05)
        self.assertGreater(out["idle"].get("capital-lost", 0) / n, 0.9, "doing nothing loses the capital")
        self.assertLess(out["naive"].get("stable-peace", 0), out["bot"].get("stable-peace", 0), "managing doctrines must matter")
        self.assertGreater(out["naive"].get("capital-lost", 0), 0)

    def test_every_ending_can_be_reached(self):
        out = run("""const e={};
          // stable peace
          e.peace=G.play(91717,G.bot);
          // capital lost
          e.lost=G.play(91717,G.idle);
          // hardened: stack every law, never answer a grievance, never fight
          const hard=(g)=>({decree:['levy','courts','tithe','registry','charter'][g.season]||null,orders:[],doctrines:[],reinforce:[],answer:0});
          e.hard=G.play(1,(g)=>{const a=hard(g);a.reinforce=[];return a});
          // reform: raise Reformers' trust with the registry then dissolve the veto
          const reform=(g)=>{const a=G.bot(g);if(g.trust.R>=G.VETO_TRUST&&g.treasury.C>=G.VETO_COST){return {decree:'veto',orders:[],doctrines:[],reinforce:[],answer:0}}return a};
          e.reform=G.play(91717,reform);
          console.log(JSON.stringify(Object.fromEntries(Object.entries(e).map(([k,g])=>[k,[g.ending,g.won,g.over]]))))""")
        self.assertEqual(out["peace"][:2], ["stable-peace", True])
        self.assertEqual(out["lost"][:2], ["capital-lost", False])
        self.assertIn(out["hard"][0], ("hardened", "capital-lost"))
        self.assertTrue(out["reform"][1] or out["reform"][0] == "stable-peace", "the veto path or the earlier peace must end the game")

    def test_dissolving_the_veto_ends_the_game_as_a_win_only_when_the_reformers_trust_the_court(self):
        out = run("""const g=G.newGame(1);g.trust.R=70;g.treasury.C=12;
          const r=G.applySeason(g,{decree:'veto',orders:[],doctrines:[],reinforce:[],answer:0});
          console.log(JSON.stringify({ending:r.game.ending,won:r.game.won,over:r.game.over,paid:g.treasury.C-r.game.treasury.C,after:G.applySeason(r.game,{}).error}))""")
        self.assertEqual((out["ending"], out["won"], out["over"]), ("reform", True, True))
        self.assertEqual(out["paid"], 10)
        self.assertEqual(out["after"], "The campaign is over.")

    def test_an_enemy_that_does_not_adapt_repeats_its_doctrine_says_so_and_adapts_about_as_often_as_stated(self):
        out = run("""// an Independent fleet standing beside a defended Court system, advancing on it
          const gg=G.newGame(1);const ind=gg.fleets.find(f=>f.f==='I');ind.at=15;
          const yes=G.aiOrders(gg,'I',true).find(o=>o.fleet===ind.id),no=G.aiOrders(gg,'I',false).find(o=>o.fleet===ind.id);
          let adapt=0,miss=0;for(let s=1;s<=150;s++){const c=G.play(s*104729+7,G.bot);c.log.forEach(l=>{if(/did not adapt/.test(l))miss++;else if(/the defenders are on/.test(l))adapt++})}
          console.log(JSON.stringify({yes:yes.reason,yesDoc:yes.doc,no:no.reason,noDoc:no.doc,own:ind.doc,adapt,miss,stated:G.ADAPT}))""")
        self.assertIn("so ", out["yes"])
        self.assertNotEqual(out["yesDoc"], out["own"], "an adapting enemy changes to the counter")
        self.assertIn("did not adapt", out["no"])
        self.assertEqual(out["noDoc"], out["own"], "a non-adapting enemy repeats its doctrine")
        total = out["adapt"] + out["miss"]
        self.assertGreater(total, 100)
        share = out["miss"] / total
        stated_miss = 1 - (out["stated"]["R"] + out["stated"]["I"]) / 200       # the two factions are about equally often the attacker
        self.assertLess(abs(share - stated_miss), 0.12, "the log shows the enemy missing about as often as the Advisor says (%.2f vs %.2f)" % (share, stated_miss))

    def test_the_advisor_explains_the_counter_of_the_counter_and_its_plan_is_the_scripted_courts(self):
        out = run("""const g=G.newGame(3);const a=G.advise(g);const b=G.bot(g);
          console.log(JSON.stringify({lines:a.lines,same:JSON.stringify(a.action)===JSON.stringify(b),fleets:g.fleets.filter(f=>f.f==='C').length}))""")
        self.assertTrue(out["same"])
        self.assertGreaterEqual(len(out["lines"]), out["fleets"] + 1)
        self.assertIn("on guard. An enemy that adapts will pick screen (screen beats guard), so be on assault (assault beats screen).", out["lines"][0])
        self.assertTrue(any("not a promise" in l for l in out["lines"]), "the advice states how far to trust it")

    def test_chance_makes_even_the_best_script_lose_sometimes_but_never_an_idle_court_win(self):
        out = run("""let lost=0,N=300;for(let i=1;i<=N;i++){if(G.play(i*7919+91717,G.bot).ending!=='stable-peace')lost++}console.log(JSON.stringify({lost,N}))""")
        self.assertGreaterEqual(out["lost"], 1, "with an enemy that sometimes misses and sometimes does not, no script is perfect")
        self.assertLess(out["lost"] / out["N"], 0.08)

    def test_a_campaign_runs_fast_enough_to_play_instantly(self):
        out = run("""const t=process.hrtime.bigint();for(let i=0;i<40;i++)G.play(i,G.bot);console.log(JSON.stringify({ms:Number(process.hrtime.bigint()-t)/1e6/40}))""")
        self.assertLess(out["ms"], 50, "a whole campaign, measured on the test machine, not a device claim")

    def test_the_files_have_no_network_payment_or_unseeded_randomness_and_the_rules_are_pure(self):
        for f in FILES:
            p = ROOT / f
            if not p.exists():
                continue
            src = re.sub(r"/\*.*?\*/", "", p.read_text(encoding="utf-8"), flags=re.S)
            for bad in ("fetch(", "XMLHttpRequest", "WebSocket", "sendBeacon", "eval(", "new Function", "innerHTML", "document.write", "stripe", "supabase"):
                self.assertNotIn(bad, src, "%s uses %s" % (f, bad))
        body = re.sub(r"/\*.*?\*/", "", (ROOT / "omega-galactic-logic.js").read_text(encoding="utf-8"), flags=re.S).split("var api =")[0]
        for bad in ("Math.random", "Date.now", "localStorage", "document.", "window", "performance", "setTimeout"):
            self.assertNotIn(bad, body, "the rules must be pure: %s" % bad)


if __name__ == "__main__":
    unittest.main()
