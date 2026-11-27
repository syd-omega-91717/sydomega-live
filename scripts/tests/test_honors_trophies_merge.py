"""trophies.html was merged into honors.html (VAULT tab). Static pins; the browser run is in the fix entry."""
import json, re, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-honors-vault.js").read_text(encoding="utf-8")
HONORS = (ROOT / "honors.html").read_text(encoding="utf-8")


class HonorsTrophiesMerge(unittest.TestCase):
    def test_the_old_page_is_gone_and_redirects(self):
        self.assertFalse((ROOT / "trophies.html").exists())
        sources = {r["source"]: r["destination"] for r in json.loads((ROOT / "vercel.json").read_text())["redirects"]}
        self.assertEqual(sources.get("/trophies"), "/honors#vault")
        self.assertEqual(sources.get("/trophies.html"), "/honors#vault")

    def test_nothing_still_links_to_the_old_page(self):
        skip = {"vercel.json"}
        for p in list(ROOT.glob("*.html")) + list(ROOT.glob("*.js")) + list((ROOT / "config").glob("*.json")):
            if p.name in skip:
                continue
            self.assertNotIn("/trophies.html", p.read_text(encoding="utf-8", errors="ignore"), p.name)

    def test_honors_has_the_vault_tab_and_loads_it_from_a_file(self):
        self.assertIn('data-mtab="vault"', HONORS)
        self.assertIn('id="mtab-vault"', HONORS)
        self.assertIn("callWhenReady('bootVault')", HONORS)
        self.assertIn('src="/omega-honors-vault.js"', HONORS)   # CSP ratchet: no new inline script block

    def test_names_and_colours_come_from_the_canon_not_a_copy(self):
        self.assertIn("C.track(n)", JS)
        self.assertIn("OmegaRealm", JS)
        self.assertNotRegex(JS, r"THE GENESIS MARK|KNOWLEDGE CROWN|FIRST LIGHT")   # the retired hard-coded names

    def test_a_failed_read_is_not_shown_as_nothing_earned(self):
        self.assertRegex(JS, r"res\[0\]\.error\s*\|\|\s*res\[1\]\.error\s*\|\|\s*res\[2\]\.error")

    def test_owner_earned_state_comes_from_persisted_rows(self):
        self.assertNotIn("isOwner?all", JS)
        self.assertIn("var tn=et.map(function(r){return r.trophy_num;});", JS)
        self.assertIn("var mn=em.map(function(r){return r.medal_num;});", JS)
        self.assertIn("var cn=ec.map(function(r){return r.cert_num;});", JS)
        self.assertIn("var row=on?et.filter(function(r){return r.trophy_num===n;})[0]:null;", JS)

    def test_the_celebration_baseline_key_is_kept(self):
        self.assertIn("omega_trophy_celebrate_seen_v1", JS)   # otherwise every member re-celebrates every old unlock once

    def test_ids_do_not_collide_with_the_record_tab(self):
        ids = re.findall(r'id="([^"]+)"', HONORS)
        self.assertEqual(len(ids), len(set(ids)), [i for i in set(ids) if ids.count(i) > 1])


if __name__ == "__main__":
    unittest.main()
