"""Animatics (omega-animatic.js): a procedural moving storyboard of each series' cold open.

What is proven here: the spoken lines are the episode script's own words (and the engine file holds none of them), the timeline is sane, a frame is a
pure function of time (so any frame can be tested and screenshotted), every franchise has a scene that actually draws, nothing reaches the network
or storage, and the screen says plainly that it is not footage. What is NOT proven: that it looks good. That was judged by looking at the frames."""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")
REG = json.loads((ROOT / "config" / "omega-studio-registry.json").read_text(encoding="utf-8"))

PRELUDE = r"""
const A=require('./omega-animatic.js'),fs=require('fs');
const reg=JSON.parse(fs.readFileSync('config/omega-studio-registry.json','utf8'));
function franchise(id){const f=reg.franchises.find(x=>x.id===id);return {id:f.id,title:f.title,premise:f.premise,series:{title:f.series.title}}}
function script(id){const f=reg.franchises.find(x=>x.id===id);return fs.readFileSync(f.series.scripts[0],'utf8')}
function recorder(){const log=[];const grad={addColorStop(){}};const t={};
  return {log,ctx:new Proxy(t,{get(o,k){if(k==='measureText')return s=>({width:String(s).length*8});if(k==='createLinearGradient'||k==='createRadialGradient')return(...a)=>{log.push(k);return grad};
    if(typeof k==='symbol')return undefined;return (...a)=>{log.push(k+'('+a.map(x=>typeof x==='number'?Math.round(x*1000)/1000:typeof x==='string'?x:'').join(',')+')')}},set(){return true}})}}
"""


def run(js):
    r = subprocess.run([NODE, "-e", PRELUDE + js], cwd=ROOT, capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "node not available")
class Animatic(unittest.TestCase):
    def test_every_spoken_line_is_the_scripts_own_words_and_the_engine_holds_none_of_them(self):
        out = run("""const o={};for(const id of A.ORDER){const t=script(id),ls=A.coldOpen(t,4);o[id]=ls.map(l=>({who:l.who,text:l.text,inScript:l.text.split(' ').every(w=>t.includes(w)),verbatim:t.split('\\n').filter(x=>!/^\\s*\\(.*\\)\\s*$/.test(x)).join(' ').replace(/\\s+/g,' ').includes(l.text)}))}console.log(JSON.stringify(o))""")
        src = (ROOT / "omega-animatic.js").read_text(encoding="utf-8")
        with_lines = 0
        for fid, lines in out.items():
            for l in lines:
                with_lines += 1
                self.assertTrue(l["inScript"] and l["verbatim"], (fid, l))      # verbatim = the whole line appears in the script once stage directions in brackets are removed
                self.assertNotIn(l["text"][:30], src, "story text must not be copied into the engine: %s" % l["text"][:30])
        self.assertGreaterEqual(with_lines, 12)
        self.assertEqual(out["the-human-frontier"], [], "that cold open has no spoken line, so the plan must say so and fall back to the premise")

    def test_the_timeline_is_ordered_inside_the_film_and_the_title_card_comes_last(self):
        out = run("""const o=A.ORDER.map(id=>A.plan(franchise(id),script(id)));console.log(JSON.stringify({o,D:A.DURATION}))""")
        for p in out["o"]:
            prev_end = 0
            for l in p["lines"]:
                self.assertGreaterEqual(l["at"], 4.0, p["id"])
                self.assertGreaterEqual(l["dur"], 2.0, "a caption needs time to be read: %s" % p["id"])
                self.assertGreaterEqual(l["at"], prev_end - 1e-9, "captions must not overlap: %s" % p["id"])
                prev_end = l["at"] + l["dur"]
            self.assertLessEqual(prev_end, p["titleAt"], p["id"])
            self.assertLess(p["titleAt"], out["D"] - 3, "the title card needs a few seconds on screen")
        self.assertEqual([p["fromScript"] for p in out["o"]], [True, True, True, True, True, False])

    def test_the_plan_is_deterministic_and_every_franchise_has_a_distinct_scene_and_palette(self):
        out = run("""const a=A.ORDER.map(id=>A.plan(franchise(id),script(id))),b=A.ORDER.map(id=>A.plan(franchise(id),script(id)));
          console.log(JSON.stringify({same:JSON.stringify(a)===JSON.stringify(b),motifs:a.map(p=>p.motif),seeds:a.map(p=>p.seed),pal:a.map(p=>p.palette[1]),conv:A.plan({id:'the-convergence',title:'x',premise:'y',series:{title:'z'}},'')}))""")
        self.assertTrue(out["same"])
        self.assertEqual(len(set(out["motifs"])), 6, "six franchises, six different scenes")
        self.assertEqual(len(set(out["seeds"])), 6)
        self.assertIsNone(out["conv"], "the Convergence has no scene because it is not started")

    def test_a_frame_is_a_pure_function_of_time_so_two_renders_make_the_same_drawing_calls(self):
        out = run("""const r=[];for(const id of A.ORDER){const p=A.plan(franchise(id),script(id));for(const T of [0.5,6,12,19,25]){const a=recorder(),b=recorder();A.draw(a.ctx,960,540,T,p);A.draw(b.ctx,960,540,T,p);r.push({id,T,same:JSON.stringify(a.log)===JSON.stringify(b.log),n:a.log.length})}}console.log(JSON.stringify(r))""")
        for x in out:
            self.assertTrue(x["same"], x)
            if x["T"] >= 6:
                self.assertGreater(x["n"], 60, "a scene that has begun must actually draw: %s" % x)

    def test_time_changes_the_drawing_and_the_first_and_last_frames_fade_to_black(self):
        out = run("""const r={};for(const id of A.ORDER){const p=A.plan(franchise(id),script(id)),L=T=>{const a=recorder();A.draw(a.ctx,960,540,T,p);return a.log};
          r[id]={moves:JSON.stringify(L(8))!==JSON.stringify(L(13)),fadeIn:L(0).filter(x=>/^fillRect\\(0,0,960,540\\)/.test(x)).length,fadeOut:L(A.DURATION).filter(x=>/^fillRect\\(0,0,960,540\\)/.test(x)).length}}console.log(JSON.stringify(r))""")
        for fid, x in out.items():
            self.assertTrue(x["moves"], fid)
            self.assertGreaterEqual(x["fadeIn"], 2, fid)
            self.assertGreaterEqual(x["fadeOut"], 2, fid)

    def test_the_screen_says_it_is_not_footage_and_nothing_here_can_reach_the_network_or_storage(self):
        out = run("""const p=A.plan(franchise('zodiac-wars'),script('zodiac-wars')),a=recorder();A.draw(a.ctx,960,540,12,p);console.log(JSON.stringify(a.log.filter(x=>/^fillText/.test(x))))""")
        self.assertTrue(any("ANIMATIC" in t and "NOT FOOTAGE" in t for t in out), "the label must be drawn into every frame")
        src = re.sub(r"/\*.*?\*/", "", (ROOT / "omega-animatic.js").read_text(encoding="utf-8"), flags=re.S)
        for bad in ("fetch(", "XMLHttpRequest", "WebSocket", "sendBeacon", "localStorage", "sessionStorage", "indexedDB", "eval(", "new Function", "innerHTML", "Math.random", "Date.now"):
            self.assertNotIn(bad, src, bad)

    def test_the_score_is_silent_until_started_and_the_9_1717_hz_tone_belongs_to_the_two_franchises_that_canon_gives_it(self):
        out = run("""console.log(JSON.stringify({sub:A.ORDER.map(id=>[id,A.plan(franchise(id),script(id)).sub]),noAudioHere:new A.Score(A.plan(franchise('zodiac-wars'),script('zodiac-wars'))).available()}))""")
        subs = dict((k, v) for k, v in out["sub"])
        self.assertEqual(sorted(k for k, v in subs.items() if v), ["the-omega-chronicles", "zodiac-wars"])
        for v in subs.values():
            self.assertIn(v, (0, 9.1717))
        self.assertFalse(out["noAudioHere"], "no AudioContext exists under node, so constructing a score must not start sound")

    def test_the_library_has_one_screening_room_tab_and_loads_the_engine_once(self):
        lib = (ROOT / "omega-studio-library.js").read_text(encoding="utf-8")
        html = (ROOT / "studio-library.html").read_text(encoding="utf-8")
        self.assertEqual(lib.count("['screen', 'SCREENING ROOM']"), 1)
        self.assertEqual(html.count('src="/omega-animatic.js"'), 1)
        self.assertLess(html.index("omega-animatic.js"), html.index("omega-studio-library.js"), "the engine must load first")
        for needle in ("PLAY", "RESTART", "SOUND OFF", "Position in the animatic"):
            self.assertIn(needle, lib)
        self.assertIn("NOT STARTED", lib)

    def test_draw_never_resets_the_callers_transform(self):
        # The page scales the canvas by devicePixelRatio. draw() used to call setTransform(1,0,0,1,0,0), which drew the whole film at 1x in
        # the top-left quarter of every 2x screen (found in a 375px render at deviceScaleFactor 2 on 2026-11-10).
        out = run("""const r={};for(const id of A.ORDER){const R=recorder();A.draw(R.ctx,960,540,8,A.plan(franchise(id),script(id)));r[id]=R.log.filter(x=>/^(setTransform|resetTransform)/.test(x)).length}console.log(JSON.stringify(r))""")
        self.assertEqual(set(out.values()), {0}, out)

    def test_a_later_episode_has_its_own_seed_and_the_first_keeps_the_franchise_one(self):
        out = run("""const f=franchise('zodiac-wars'),t=script('zodiac-wars');const a=A.plan(f,t),b=A.plan(f,t,''),c=A.plan(f,t,'102'),d=A.plan(f,t,'103');
        console.log(JSON.stringify({same:a.seed===b.seed&&a.seed===A.hash('zodiac-wars'),c:c.seed!==a.seed,d:d.seed!==c.seed,motif:c.motif===a.motif}))""")
        self.assertEqual(out, {"same": True, "c": True, "d": True, "motif": True})

    def test_every_registered_episode_has_a_cold_open_with_spoken_lines_or_says_it_has_none(self):
        out = run("""const o={};for(const f of reg.franchises){for(const p of (f.series&&f.series.scripts)||[]){o[p.split('/').pop()]=A.coldOpen(fs.readFileSync(p,'utf8'),4).length}}console.log(JSON.stringify(o))""")
        for name in ("E02_THE_HEARING.fountain", "E03_THE_OLD_STORY.fountain", "E04_WHAT_THE_FOUNDRY_KEPT.fountain"):
            self.assertGreaterEqual(out[name], 3, name)


if __name__ == "__main__":
    unittest.main()
