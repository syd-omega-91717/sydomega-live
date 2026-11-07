"""OMEGA: CIVILIZATION 91717, Slice 0 (a strategy simulation, PROTOTYPE): the rules module is pure and is proven under Node.

These are the GDD's acceptance criteria made executable: (1) determinism, the same seed and the same actions give the same twelve years;
(2) forecast correctness against a known toy model, where the event probability over one year has a closed form the ensemble must match;
(3) the Brier calculation on a hand-computed ledger; (4) a scripted bot finishes the scenario and beats a random player by a wide margin;
(5) forecast latency inside the 50 ms budget; plus ORION's honesty as a measured property (calibrated across many games and better than
a constant guess), forecasts that cannot change the world they describe, and a save format that refuses a tampered file."""
import json
import pathlib
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")
FILES = ["omega-civ-logic.js", "omega-civ-game.js"]


def run(js):
    r = subprocess.run([NODE, "-e", "const C=require('./omega-civ-logic.js');" + js], cwd=ROOT, capture_output=True, text=True, timeout=300)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "node not available")
class CivLogic(unittest.TestCase):
    def test_the_same_seed_and_actions_give_the_same_twelve_years_and_another_seed_does_not(self):
        out = run("""const a=C.playBot(91717,g=>C.bot(g)),b=C.playBot(91717,g=>C.bot(g)),c=C.playBot(91718,g=>C.bot(g));
          console.log(JSON.stringify({same:JSON.stringify(a)===JSON.stringify(b),diff:JSON.stringify(a.eventLog)!==JSON.stringify(c.eventLog),years:a.year,done:a.done}))""")
        self.assertTrue(out["same"])
        self.assertTrue(out["diff"])
        self.assertEqual((out["years"], out["done"]), (12, True))

    def test_a_replay_of_the_saved_actions_reproduces_the_game_and_a_tampered_save_is_caught(self):
        out = run("""const g=C.playBot(4242,x=>({...C.bot(x),ask:true})),r=C.replay(4242,g.plan),sum=C.checksum(4242,g.plan);
          const t=JSON.parse(JSON.stringify(g.plan));t[3].alloc=[6,0,0,0];
          console.log(JSON.stringify({same:JSON.stringify(r.game)===JSON.stringify(g),sumStable:sum===C.checksum(4242,g.plan),tampered:C.checksum(4242,t)!==sum,err:r.error||null}))""")
        self.assertTrue(out["same"])
        self.assertTrue(out["sumStable"])
        self.assertTrue(out["tampered"], "an edited save must not keep its checksum")
        self.assertIsNone(out["err"])

    def test_the_generator_is_uniform_enough_and_its_streams_are_independent(self):
        out = run("""const r=C.rng(1),bins=new Array(10).fill(0);for(let i=0;i<100000;i++)bins[r.below(10)]++;
          const e=10000,chi=bins.reduce((s,b)=>s+(b-e)*(b-e)/e,0);
          const s1=C.streamSeed(5,0,0,3),s2=C.streamSeed(5,1,0,3),s3=C.streamSeed(5,1,1,3),s4=C.streamSeed(5,1,1,4);
          console.log(JSON.stringify({chi,distinct:new Set([s1,s2,s3,s4]).size,rep:C.rng(9).u32()===C.rng(9).u32(),other:C.rng(9).u32()!==C.rng(10).u32()}))""")
        self.assertLess(out["chi"], 27.9, "chi-square on 10 bins (9 dof) at p = 0.001")
        self.assertEqual(out["distinct"], 4)
        self.assertTrue(out["rep"] and out["other"])

    def test_the_forecast_matches_a_closed_form_toy_case_over_one_year(self):
        # With one year left the forecast horizon is one year, so P(event) is exactly the model's per-mille probability.
        out = run("""const base=C.newGame(31337);const res=[];
          [[2,1,1,2],[6,0,0,0],[0,0,0,6],[1,1,4,0]].forEach(alloc=>{
            const g=JSON.parse(JSON.stringify(base));g.year=11;
            const pr=C.eventProbs(C.afterPlan(g.res,g.policies,alloc)),f=C.forecast(g,alloc,6000);
            C.BAD.forEach(e=>res.push({e,exact:pr[e]/1000,got:f.p[e],h:f.h}))});console.log(JSON.stringify(res))""")
        for x in out:
            n = 6000
            sd = (x["exact"] * (1 - x["exact"]) / n) ** 0.5
            self.assertEqual(x["h"], 1)
            self.assertLessEqual(abs(x["got"] - x["exact"]), max(4 * sd, 1e-9), x)

    def test_quantiles_of_a_known_array_are_the_nearest_rank_values(self):
        out = run("""const a=[1,2,3,4,5,6,7,8,9,10,11];console.log(JSON.stringify([C.quantile(a,0),C.quantile(a,0.1),C.quantile(a,0.5),C.quantile(a,0.9),C.quantile(a,1),C.quantile([],0.5)]))""")
        self.assertEqual(out, [1, 2, 6, 10, 11, None])

    def test_brier_score_baseline_and_reliability_on_a_hand_computed_ledger(self):
        out = run("""const L=[{p:1,outcome:1},{p:0,outcome:0},{p:0.5,outcome:1},{p:0.5,outcome:0},{p:0.9,outcome:null}];
          console.log(JSON.stringify({b:C.brier(L),base:C.brierBaseline(L),rel:C.reliability(L).map(x=>[x.n,x.said,x.happened]),none:C.brier([{p:0.5,outcome:null}])}))""")
        self.assertEqual(out["b"]["n"], 4)
        self.assertAlmostEqual(out["b"]["brier"], (0 + 0 + 0.25 + 0.25) / 4)       # 0.125, the unresolved forecast is not scored
        self.assertAlmostEqual(out["base"]["brier"], 0.25)                           # base rate 0.5 against four 0/1 outcomes
        self.assertEqual(out["rel"][0], [1, 0, 0])                                   # said 0   -> happened 0
        self.assertEqual(out["rel"][2], [2, 0.5, 0.5])                               # said 0.5 -> happened 1 of 2
        self.assertEqual(out["rel"][4], [1, 1, 1])                                   # said 1   -> happened
        self.assertIsNone(out["none"])

    def test_asking_orion_scores_a_forecast_only_after_its_years_have_passed_and_matches_what_happened(self):
        out = run("""let g=C.newGame(2024);const a=[2,1,1,2];
          let r=C.applyYear(g,{alloc:a,toggle:null,ask:true});g=r.game;const afterOne=g.ledger.map(e=>e.outcome);
          r=C.applyYear(g,{alloc:a,toggle:null,ask:false});g=r.game;r=C.applyYear(g,{alloc:a,toggle:null,ask:false});g=r.game;
          const ok=g.ledger.every(e=>{let o=0;for(let y=e.year;y<e.year+e.h;y++)if(g.eventLog[y].indexOf(e.event)>=0)o=1;return e.outcome===o});
          console.log(JSON.stringify({afterOne,resolved:g.ledger.map(e=>e.outcome!==null),ok,n:g.ledger.length,h:g.ledger[0].h}))""")
        self.assertEqual(out["afterOne"], [None, None, None])
        self.assertEqual(out["resolved"], [True, True, True])
        self.assertTrue(out["ok"])
        self.assertEqual((out["n"], out["h"]), (3, 3))

    def test_a_forecast_cannot_change_the_world_it_describes(self):
        out = run("""const a=C.playBot(777,g=>({...C.bot(g),ask:false})),b=C.playBot(777,g=>({...C.bot(g),ask:true}));
          const g=C.newGame(5),before=JSON.stringify(g);C.forecast(g,[2,1,1,2]);
          console.log(JSON.stringify({sameRes:JSON.stringify(a.res)===JSON.stringify(b.res)&&JSON.stringify(a.eventLog)===JSON.stringify(b.eventLog),pure:JSON.stringify(g)===before}))""")
        self.assertTrue(out["sameRes"], "asking ORION must not alter the events that actually happen")
        self.assertTrue(out["pure"])

    def test_forecasts_near_the_end_cover_only_the_years_left_so_every_one_is_scored(self):
        out = run("""let g=C.newGame(1);const a=[2,1,1,2];for(let i=0;i<10;i++){g=C.applyYear(g,{alloc:a,toggle:null,ask:i>=9}).game}
          g=C.applyYear(g,{alloc:a,toggle:null,ask:true}).game;g=C.applyYear(g,{alloc:a,toggle:null,ask:false}).game;
          console.log(JSON.stringify({hs:g.ledger.map(e=>e.h),resolved:g.ledger.every(e=>e.outcome!==null),done:g.done}))""")
        self.assertEqual(out["hs"], [3, 3, 3, 2, 2, 2])
        self.assertTrue(out["resolved"])
        self.assertTrue(out["done"])

    def test_invalid_actions_are_refused_and_change_nothing(self):
        out = run("""const g=C.newGame(3),before=JSON.stringify(g),bad=[{alloc:[1,1,1,1],toggle:null},{alloc:[7,0,0,-1],toggle:null},{alloc:[2,1,1,2],toggle:'nope'},{alloc:[2,1,1],toggle:null},{alloc:[2.5,1,1.5,1],toggle:null},null];
          console.log(JSON.stringify({errs:bad.map(a=>!!C.applyYear(g,a).error),untouched:JSON.stringify(g)===before}))""")
        self.assertEqual(out["errs"], [True] * 6)
        self.assertTrue(out["untouched"])

    def test_an_audit_costs_trust_needs_a_forecast_and_is_part_of_the_save(self):
        out = run("""const g=C.newGame(11),a=[2,1,1,2];
          const noAsk=C.applyYear(g,{alloc:a,toggle:null,ask:false,audit:true});
          const withA=C.applyYear(g,{alloc:a,toggle:null,ask:true,audit:true}).game,without=C.applyYear(g,{alloc:a,toggle:null,ask:true}).game;
          console.log(JSON.stringify({err:noAsk.error||null,trustGap:without.res.trust-withA.res.trust,cost:C.AUDIT_COST,saved:withA.plan[0].audit,
            sumDiffers:C.checksum(11,withA.plan)!==C.checksum(11,[{...withA.plan[0],audit:false}]),replay:JSON.stringify(C.replay(11,withA.plan).game)===JSON.stringify(withA)}))""")
        self.assertEqual(out["err"], "An audit needs a forecast to audit.")
        self.assertEqual(out["trustGap"], out["cost"])
        self.assertTrue(out["saved"] and out["sumDiffers"] and out["replay"])

    def test_a_collapse_ends_the_game_at_once_and_a_finished_game_takes_no_more_years(self):
        out = run("""let g=C.newGame(8);g.res.trust=2;const r=C.applyYear(g,{alloc:[0,0,0,6],toggle:null});
          const done=C.applyYear(C.playBot(8,x=>C.bot(x)),{alloc:[2,1,1,2],toggle:null});
          console.log(JSON.stringify({res:r.game.res,done:r.game.done,reason:r.game.result.reason,won:r.game.result.won,again:done.error||null,year:r.game.year}))""")
        self.assertTrue(out["done"])
        self.assertFalse(out["won"])
        self.assertIn(out["reason"], ("trust-collapse", "below-threshold"))
        self.assertEqual(out["again"], "The game is over.")

    def test_the_scripted_bot_finishes_and_wins_the_scenario_and_a_random_player_mostly_does_not(self):
        out = run("""const s=(ch,N)=>{let w=0;for(let i=1;i<=N;i++)if(C.playBot(i*7919+91717,ch).result.won)w++;return w/N};
          const g=C.playBot(91717,x=>C.bot(x));
          console.log(JSON.stringify({genesis:g.result,bot:s(x=>C.bot(x),300),rnd:s((x,seed)=>C.randomBot(x,seed),300)}))""")
        self.assertTrue(out["genesis"]["won"], "the bot finishes Genesis 91717 (seed 91717)")
        self.assertEqual(out["genesis"]["year"], 12)
        self.assertGreaterEqual(out["bot"], 0.75)
        self.assertLessEqual(out["rnd"], 0.40)
        self.assertGreater(out["bot"] - out["rnd"], 0.45, "decisions must matter")

    def test_orion_is_calibrated_across_many_games_and_beats_a_constant_guess(self):
        out = run("""let led=[];for(let s=1;s<=250;s++){led=led.concat(C.playBot(s*104729+7,x=>({...C.bot(x),ask:true})).ledger)}
          console.log(JSON.stringify({b:C.brier(led),base:C.brierBaseline(led),rel:C.reliability(led)}))""")
        self.assertGreater(out["b"]["n"], 5000)
        self.assertLess(out["b"]["brier"], out["base"]["brier"] * 0.9, "forecasts must carry information, not just the base rate")
        for b in out["rel"]:
            if b["n"] >= 200:
                self.assertLessEqual(abs(b["said"] - b["happened"]), 0.05, "ORION's stated odds must match what happened: %s" % b)

    def test_a_forecast_fits_the_50_ms_budget(self):
        out = run("""const g=C.newGame(1);const t=process.hrtime.bigint();for(let i=0;i<40;i++)C.forecast(g,[2,1,1,2]);
          console.log(JSON.stringify({ms:Number(process.hrtime.bigint()-t)/1e6/40,n:C.ENSEMBLE}))""")
        self.assertEqual(out["n"], 200)
        self.assertLess(out["ms"], 50, "measured on the test machine, not a device claim")

    def test_the_files_have_no_network_payment_or_unseeded_randomness(self):
        for f in FILES:
            import re
            src = re.sub(r"/\*.*?\*/", "", (ROOT / f).read_text(encoding="utf-8"), flags=re.S)   # code only; a comment may name what it avoids
            for bad in ("fetch(", "XMLHttpRequest", "WebSocket", "sendBeacon", "eval(", "new Function", "innerHTML", "document.write", "stripe", "supabase"):
                self.assertNotIn(bad, src, "%s uses %s" % (f, bad))
        import re
        logic = (ROOT / "omega-civ-logic.js").read_text(encoding="utf-8")
        body = re.sub(r"/\*.*?\*/", "", logic, flags=re.S).split("var api =")[0]
        for bad in ("Math.random", "Date.now", "localStorage", "document.", "window", "performance", "setTimeout"):
            self.assertNotIn(bad, body, "the rules must be pure: %s" % bad)


if __name__ == "__main__":
    unittest.main()
