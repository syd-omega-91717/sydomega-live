"""The Studio library must be derived from canon, stay owner-only, and never claim more than the canon does.

Planted violations: a stale generated file, an owner function that serves before checking, a page that names a static path.
"""
import importlib.util
import json
import pathlib
import re
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("studio_library", ROOT / "scripts" / "studio-library.py")
lib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lib)
REG = json.loads((ROOT / "config" / "omega-studio-registry.json").read_text(encoding="utf-8"))
ALLOWED = {"CONCEPT", "SCREENPLAY_DRAFT", "SCRIPT_DRAFT_SHORT", "SCRIPTS_DRAFT", "BIBLE_DRAFT", "DESIGNED", "PROTOTYPE"}


class StudioLibrary(unittest.TestCase):
    def test_generated_payload_is_current(self):
        self.assertEqual(lib.check(), [])

    def test_a_stale_payload_is_caught(self):
        real = lib.OUT
        with tempfile.TemporaryDirectory() as d:
            fake = pathlib.Path(d) / "library-data.ts"
            fake.write_text(real.read_text(encoding="utf-8").replace("MYTH OF THE STONES", "MYTH OF THE STONEZ", 1), encoding="utf-8")
            lib.OUT = fake
            try:
                self.assertTrue(any("stale" in f for f in lib.check()))
            finally:
                lib.OUT = real

    def test_the_inventory_matches_the_registry(self):
        p = lib.build()
        self.assertEqual(len(p["franchises"]), 7)
        self.assertEqual(sum(len(f["films"]) for f in p["franchises"]), 26)
        self.assertEqual(sum(len(f["characters"]) for f in p["franchises"]), len(REG["characters"]))
        kinds = sorted(d["kind"] for d in p["documents"].values())
        self.assertEqual(kinds, ["design"] * 4 + ["screenplay"] * 2 + ["teleplay"] * 8)

    def test_an_episode_title_comes_from_its_own_header_so_an_apostrophe_survives(self):
        titles = {v["title"] for k, v in lib.build()["documents"].items() if k.startswith("episode:")}
        self.assertIn("105 The Traitor's Memory", titles)
        self.assertEqual(sorted(t[:3] for t in titles), [str(n) for n in range(101, 109)])

    def test_every_document_reference_resolves_and_has_text(self):
        p = lib.build()
        refs = []
        for f in p["franchises"]:
            refs += [d for fm in f["films"] for d in fm["docs"]] + f["series"]["docs"] + ([f["game"]["doc"]] if f["game"]["doc"] else [])
        self.assertTrue(set(refs) <= set(p["documents"]))
        self.assertEqual(set(refs), set(p["documents"]), "a document nothing links to would be unreachable")
        for d in p["documents"].values():
            self.assertGreater(len(d["text"].split()), 200)

    def test_statuses_are_the_canon_statuses_and_only_one_prototype_is_openable(self):
        p = lib.build()
        for f in p["franchises"]:
            for fm in f["films"]:
                self.assertIn(fm["status"], ALLOWED)
            self.assertIn(f["series"]["status"], ALLOWED)
            self.assertIn(f["game"]["status"], ALLOWED)
            self.assertEqual(f["game"]["multiplayer"], "UNAVAILABLE", f["id"])
        for d in p["documents"].values():
            self.assertIn(d["status"], ALLOWED)
        openable = [f["id"] for f in p["franchises"] if f["game"]["prototype"]]
        self.assertEqual(openable, ["myth-of-the-stones"])
        proto = [f["game"]["prototype"] for f in p["franchises"] if f["game"]["prototype"]][0]
        self.assertTrue((ROOT / proto.lstrip("/")).is_file(), proto)

    def test_no_document_writes_the_frequency_wrongly(self):
        for d in lib.build()["documents"].values():
            self.assertNotRegex(d["text"], r"9\.17\s?Hz(?!.*9\.1717)")

    def test_the_owner_function_serves_only_after_the_owner_check(self):
        src = (ROOT / "supabase" / "functions" / "studio-library" / "index.ts").read_text(encoding="utf-8")
        for bad in ("req.json", "req.text", "searchParams", "req.formData", "req.url", "decideAccess("):
            self.assertNotIn(bad, src, bad)
        self.assertLess(src.index("decideOwner("), src.index("library: LIBRARY"))
        cfg = (ROOT / "supabase" / "config.toml").read_text(encoding="utf-8")
        self.assertRegex(cfg, r"\[functions\.studio-library\]\s*\nverify_jwt\s*=\s*true")

    def test_both_owner_functions_keep_the_same_guard(self):
        pat = re.compile(r"decideOwner\(userId, profile, profileError\)")
        for fn in ("studio-canon", "studio-library"):
            src = (ROOT / "supabase" / "functions" / fn / "index.ts").read_text(encoding="utf-8")
            self.assertRegex(src, pat, fn)
            self.assertIn('.select("is_owner")', src, fn)
            self.assertIn("Authorization", src, fn)
            self.assertIn("auth.getUser()", src, fn)

    def test_a_failed_profile_read_returns_only_a_fixed_shape_reason_and_logs_the_rest(self):
        """The owner saw `UNAVAILABLE 503 profile_unavailable` with no way to learn why. The function now returns a short reason
        (HTTP status and database error code, sanitised) and logs the real message server-side; it must never put a message or a key
        in the response."""
        for fn in ("studio-canon", "studio-library"):
            src = (ROOT / "supabase" / "functions" / fn / "index.ts").read_text(encoding="utf-8")
            self.assertIn('replace(/[^A-Za-z0-9_]/g, "").slice(0, 24)', src, fn)
            self.assertIn("OWNER_PROFILE_READ_FAILED", src, fn)
            self.assertIn("verdict.status === 503 && reason", src, fn)
            # the response body carries `reason`, never `message`, and nothing from the key helpers
            body = re.search(r"if \(!verdict\.ok\) return json\((.*?), verdict\.status", src, re.S).group(1)
            self.assertIn("reason", body, fn)
            self.assertNotIn("message", body, fn)
            self.assertNotIn("adminKey", body, fn)
            logs = re.findall(r"console\.error\((.*?)\);", src)
            self.assertTrue(logs, fn)
            for line in logs:
                self.assertNotIn("adminKey", line, fn)
                self.assertNotIn("publicKey", line, fn)
                self.assertNotIn("Authorization", line, fn)

    def test_the_pages_show_only_a_sanitised_reason(self):
        for js in ("omega-studio-library.js", "omega-worlds.js"):
            src = (ROOT / js).read_text(encoding="utf-8")
            self.assertIn("e.reason = b && b.reason", src, js)
            self.assertIn("/^[A-Za-z0-9_]{1,24}$/.test(e.reason)", src, js)

    def test_the_page_and_script_name_no_static_data_path(self):
        for f in ("studio-library.html", "omega-studio-library.js"):
            t = (ROOT / f).read_text(encoding="utf-8")
            self.assertNotIn("library-data", t, f)
            self.assertNotRegex(t, r"/config/[a-z-]+\.json", f)
            self.assertNotIn("innerHTML", t, f)
        self.assertIn("studio-library", (ROOT / "omega-studio-library.js").read_text(encoding="utf-8"))

    def test_help_exits_zero(self):
        import subprocess, sys
        out = subprocess.run([sys.executable, str(ROOT / "scripts" / "studio-library.py"), "--help"], capture_output=True, text=True)
        self.assertEqual(out.returncode, 0)
        self.assertIn("owner-only", out.stdout)


if __name__ == "__main__":
    unittest.main()
