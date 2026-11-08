"""Weather: one code table for the whole platform, correct words and coordinates, and a header that lets the page ask for location.

Regression for four defects found by reproducing them in a real browser: production sent `Permissions-Policy: geolocation=()`, which denies
location to every page, so the dashboard weather could only ever say "LOCATION PERMISSION DENIED"; any code the dashboard's private table lacked
was shown as "CLEAR" (snow showers read as sunshine); the two pages carried different, incomplete copies of the table; and a western or southern
position was printed with a minus sign under the wrong hemisphere ("40.7N -74.0E" for New York)."""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
NODE = shutil.which("node")


def run(js):
    r = subprocess.run([NODE, "-e", "const W=require('./omega-weather.js');" + js], cwd=ROOT, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "node not available")
class Weather(unittest.TestCase):
    def test_every_code_open_meteo_documents_has_a_real_label_and_an_icon(self):
        documented = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99]
        out = run("console.log(JSON.stringify(%s.map(c=>W.describe(c))))" % json.dumps(documented))
        for c, d in zip(documented, out):
            self.assertTrue(d["known"], c)
            self.assertTrue(d["text"] and d["icon"], c)
        self.assertEqual(len({d["text"] for d in out}), len(documented), "no two codes may share one label")

    def test_a_code_nobody_knows_is_never_shown_as_fair_weather(self):
        out = run("console.log(JSON.stringify([W.describe(7),W.describe(undefined),W.describe(null),W.describe('85'),W.describe(NaN),W.describe(85)]))")
        for d in out[:5]:
            self.assertFalse(d["known"])
            self.assertNotRegex(d["text"].lower(), r"clear|sun|fair")
        self.assertEqual(out[5]["text"], "Light snow showers", "the case the dashboard used to show as CLEAR")

    def test_the_sign_of_a_coordinate_is_its_hemisphere(self):
        out = run("console.log(JSON.stringify([W.coords(40.71,-74.01),W.coords(-33.87,151.21),W.coords(33.89,35.5),W.coords(-34.6,-58.38),W.coords(0,0)]))")
        self.assertEqual(out, ["40.7°N 74.0°W", "33.9°S 151.2°E", "33.9°N 35.5°E", "34.6°S 58.4°W", "0.0°N 0.0°E"])

    def test_the_request_encodes_its_parts_and_asks_only_for_what_the_page_shows(self):
        out = run("console.log(JSON.stringify([W.url(33.9,35.5,{tz:'Asia/Beirut'}),W.url(1.5,-2.5,{uv:true})]))")
        self.assertIn("timezone=Asia%2FBeirut", out[0])
        self.assertNotIn("uv_index", out[0])
        self.assertIn("uv_index", out[1])
        self.assertIn("latitude=1.5&longitude=-2.5", out[1])
        self.assertTrue(out[1].endswith("timezone=auto"))
        for u in out:
            self.assertTrue(u.startswith("https://api.open-meteo.com/v1/forecast?"))

    def test_a_calm_wind_is_zero_not_missing_and_an_unusable_reply_is_refused(self):
        out = run("""const ok=W.parse({current:{temperature_2m:-3.4,relative_humidity_2m:88,wind_speed_10m:0,weather_code:85,uv_index:0}});
          const part=W.parse({current:{temperature_2m:20}});
          console.log(JSON.stringify({ok,part,none:W.parse({}),nul:W.parse(null),bad:W.parse({current:{temperature_2m:'hot'}}),wind:W.windText(ok.wind),missing:W.windText(null),temp:W.tempText(-3.4),temp1:W.tempText(20.04,1),hum:W.humidityText(88)}))""")
        self.assertEqual(out["ok"]["wind"], 0)
        self.assertEqual(out["wind"], "0")
        self.assertEqual(out["missing"], "—")
        self.assertEqual(out["part"], {"temp": 20, "humidity": None, "wind": None, "uv": None, "code": None})
        self.assertIsNone(out["none"]); self.assertIsNone(out["nul"]); self.assertIsNone(out["bad"])
        self.assertEqual((out["temp"], out["temp1"], out["hum"]), ("-3°C", "20.0°C", "88%"))

    def test_there_is_exactly_one_weather_code_table_in_the_whole_platform(self):
        hits = []
        for p in list(ROOT.glob("*.js")) + list(ROOT.glob("*.html")):
            if p.name == "omega-weather.js":
                continue
            txt = p.read_text(encoding="utf-8", errors="ignore")
            if re.search(r"Light drizzle|Partly cloudy|THUNDERSTORM\+HAIL|WMO_CODES|WMO_ICONS|var WMO\s*=", txt):
                hits.append(p.name)
        self.assertEqual(hits, [], "a second copy of the weather-code table: %s" % hits)
        for page in ("dashboard.html", "pulse.html"):
            self.assertIn('src="/omega-weather.js"', (ROOT / page).read_text(encoding="utf-8"), page + " must load the shared module")
        brief = (ROOT / "omega-daily-brief.js").read_text(encoding="utf-8")
        self.assertIn("OmegaWeather", brief)
        self.assertNotIn("api.open-meteo.com", brief)
        self.assertNotIn("api.open-meteo.com", (ROOT / "pulse.html").read_text(encoding="utf-8"))

    def test_the_site_may_ask_for_location_but_camera_microphone_and_payment_stay_off(self):
        vj = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        vals = [h["value"] for r in vj["headers"] for h in r["headers"] if h["key"] == "Permissions-Policy"]
        self.assertEqual(len(vals), 1, "exactly one Permissions-Policy, or the browser intersects them and the narrowest wins")
        pol = vals[0]
        self.assertIn("geolocation=(self)", pol, "geolocation=() denies location to every page and made the dashboard weather impossible")
        for feature in ("camera", "microphone", "payment", "usb"):
            self.assertIn(feature + "=()", pol)
        self.assertNotIn("*", pol)

    def test_the_dashboard_panel_reports_what_actually_went_wrong(self):
        brief = (ROOT / "omega-daily-brief.js").read_text(encoding="utf-8")
        self.assertIn("LOCATION PERMISSION DENIED", brief)
        self.assertIn("LOCATION TIMED OUT", brief)
        self.assertIn("LOCATION UNAVAILABLE", brief)
        self.assertRegex(brief, r"timeout:\s*10000")
        self.assertNotRegex(brief, r"WMO\[code\]\|\|'CLEAR'", "an unknown code must never default to CLEAR")


if __name__ == "__main__":
    unittest.main()
