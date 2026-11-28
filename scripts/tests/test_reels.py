"""Agent reels (omega-reels.js): twelve procedural animatics, one per agent in omega-agents.json.

The point of this file is the claim the reels make about themselves: every word on screen comes from that agent's own record (or is one of a few fixed labels), and the
reel says it is not footage. It is checked by drawing every reel at every half second through a recording canvas and failing if any drawn string is not in the record.
Also: a frame is a pure function of its time (same call log twice), different agents draw differently, and the module has no network, storage or HTML-injection code."""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")

HARNESS = """
const R=require('./omega-reels.js');const agents=require('./omega-agents.json').agents;
function fakeCtx(log){
  const grad={addColorStop(){}};
  return new Proxy({}, {get(t,k){
    if(k==='fillText') return (s)=>log.push(String(s));
    if(k==='measureText') return (s)=>({width:String(s).length*13});
    if(k==='createRadialGradient'||k==='createLinearGradient') return ()=>grad;
    return ()=>{};
  }, set(){return true;}});
}
function frames(a,Ts){const p=R.plan(a);return Ts.map(T=>{const log=[];R.draw(fakeCtx(log),T,p,960,540,'#c9a84c');return log});}
const Ts=[];for(let t=0;t<=22;t+=0.5)Ts.push(t);
"""


def run(js):
    r = subprocess.run([NODE, "-e", HARNESS + js], cwd=ROOT, capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "node not available")
class Reels(unittest.TestCase):
    def test_there_is_one_reel_per_agent_and_the_plan_is_the_agents_own_record(self):
        out = run("console.log(JSON.stringify(agents.map(a=>{const p=R.plan(a);return {n:p.name,g:p.greeting===a.greeting,d:p.domains.length,m:p.motif,s:p.seed}})))")
        self.assertEqual(len(out), 12)
        self.assertEqual(len({o["s"] for o in out}), 12, "every agent needs its own seed")
        for o in out:
            self.assertTrue(o["g"], o["n"])
            self.assertEqual(o["d"], 5, o["n"])
            self.assertIn(o["m"], ("fire", "water", "wind", "metal", "sand"), o["n"])

    def test_every_word_drawn_is_in_the_agents_record_or_a_fixed_label(self):
        out = run("""
const bad=[];
for(const a of agents){
  const allowed=(R.FIXED.join('|')+'|'+[a.name,a.sign,a.element,a.god,a.role,a.greeting,a.voice,a.href,...a.domains].join('|')).toUpperCase();
  const clock=new RegExp('^'+a.name.toUpperCase()+' \\\\u00b7 [0-9.]+ / '+R.DURATION+' S$');
  frames(a,Ts).forEach((log,i)=>log.forEach(s=>{
    const u=s.toUpperCase();
    if(!(allowed.includes(u)||clock.test(u)))bad.push([a.name,Ts[i],s]);
  }));
}
console.log(JSON.stringify({bad:bad.slice(0,5),n:bad.length}))""")
        self.assertEqual(out["n"], 0, "text on screen that is not in the agent's record: %r" % out["bad"])

    def test_the_reel_always_says_it_is_not_footage(self):
        out = run("console.log(JSON.stringify(agents.map(a=>frames(a,Ts).every(log=>log.includes(R.LABEL)))))")
        self.assertTrue(all(out))
        self.assertIn("NOT FOOTAGE", (ROOT / "omega-reels.js").read_text(encoding="utf-8"))

    def test_the_greeting_is_typed_out_whole_by_the_end_of_its_beat_and_never_changed(self):
        out = run("""
const r=agents.map(a=>{
  const lines=frames(a,[6.2,9,11.9]).map(l=>l.filter(s=>a.greeting.includes(s)&&s.length>8));
  const joined=lines[2].join(' ').replace(/\\s+/g,' ');
  return {n:a.name,start:lines[0].join('').length,end:joined===a.greeting};
});console.log(JSON.stringify(r))""")
        for o in out:
            self.assertTrue(o["end"], "%s: the greeting is not drawn whole by 11.9 s" % o["n"])

    def test_a_frame_is_a_pure_function_of_its_time(self):
        out = run("""
const a=agents[0];const x=JSON.stringify(frames(a,Ts)),y=JSON.stringify(frames(a,Ts));
const a2=JSON.stringify(frames(agents[1],[15])),a1=JSON.stringify(frames(agents[0],[15]));
console.log(JSON.stringify({same:x===y,differ:a1!==a2}))""")
        self.assertTrue(out["same"])
        self.assertTrue(out["differ"])

    def test_each_beat_shows_what_it_should(self):
        out = run("""
const a=agents[0];const f=Object.fromEntries([1,4,9,15,19.5].map(T=>[T,frames(a,[T])[0]]));
console.log(JSON.stringify({open:f[1].includes(a.sign.toUpperCase()),name:a.name.toUpperCase().split('').every(c=>f[4].includes(c)),
 voice:f[9].some(s=>a.greeting.toUpperCase().includes(s.toUpperCase())&&s.length>8),
 dom:a.domains.every(d=>f[15].includes(d.toUpperCase())),meta:[a.sign,a.element,a.god].every(v=>f[15].includes(v.toUpperCase())),
 close:f[19.5].includes(a.href)}))""")
        for k, v in out.items():
            self.assertTrue(v, k)

    def test_motion_is_continuous_one_frame_to_the_next_for_every_element(self):
        # A reel could be a pure function of time and still jitter: re-seeding the randomness every tick moves every particle every frame. Compare the points drawn
        # at two times one 60 Hz tick apart; nothing may jump. (A time-dependent seed mutant passed every other test.)
        out = run("""
function arcs(a,T){const log=[];const p=R.plan(a);const g={addColorStop(){}};
  const ctx=new Proxy({}, {get(t,k){ if(k==='arc'||k==='moveTo'||k==='lineTo'||k==='fillRect')return (x,y)=>log.push([x,y]); if(k==='measureText')return (s)=>({width:String(s).length*13});
    if(k==='createRadialGradient'||k==='createLinearGradient')return ()=>g; return ()=>{}; }, set(){return true;}});
  R.draw(ctx,T,p,960,540,'#c9a84c');return log;}
const seen={},res=[];
for(const a of agents){const e=a.element;if(seen[e])continue;seen[e]=1;
  const A=arcs(a,10),B=arcs(a,10+1/60);let worst=0;
  const n=Math.min(A.length,B.length);
  for(let i=0;i<n;i++){worst=Math.max(worst,Math.abs(A[i][0]-B[i][0]),Math.abs(A[i][1]-B[i][1]));}
  res.push({e,count:[A.length,B.length],worst});}
console.log(JSON.stringify(res))""")
        self.assertEqual(len(out), 5, "one agent per element")
        for o in out:
            self.assertEqual(o["count"][0], o["count"][1], o["e"])
            self.assertGreater(o["count"][0], 0, o["e"])
            self.assertLess(o["worst"], 12, "%s jumps %.1f px in one tick" % (o["e"], o["worst"]))

    def test_beats_cover_the_whole_reel_in_order(self):
        out = run("console.log(JSON.stringify({b:R.BEATS,d:R.DURATION}))")
        t = 0
        for name, a, b in out["b"]:
            self.assertEqual(a, t, name)
            self.assertGreater(b, a, name)
            t = b
        self.assertEqual(t, out["d"])


class Source(unittest.TestCase):
    def test_no_network_storage_or_html_injection_beyond_the_one_json_fetch(self):
        src = (ROOT / "omega-reels.js").read_text(encoding="utf-8")
        for bad in (r"XMLHttpRequest", r"WebSocket", r"sendBeacon", r"localStorage", r"sessionStorage", r"indexedDB", r"innerHTML", r"document\.write", r"eval\s*\(", r"new Function", r"supabase", r"stripe"):
            self.assertIsNone(re.search(bad, src, re.I), bad)
        self.assertEqual(len(re.findall(r"\.fetch\(", src)), 1)
        self.assertIn("r.ok", src, "the fetch must check the response (CLAUDE.md section 9)")

    def test_the_motifs_are_the_five_elements_the_agents_actually_have(self):
        agents = json.loads((ROOT / "omega-agents.json").read_text(encoding="utf-8"))["agents"]
        have = {a["element"].lower() for a in agents}
        src = (ROOT / "omega-reels.js").read_text(encoding="utf-8")
        for e in have:
            self.assertRegex(src, r"MOTIFS = \{[^}]*\b%s: 1" % e)


if __name__ == "__main__":
    unittest.main()
