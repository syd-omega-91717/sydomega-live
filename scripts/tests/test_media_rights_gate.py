"""No licence, no ship: scripts/media-rights-gate.py makes a new audio, video or image file carry a rights record.

The gate decides nothing about what is allowed; it makes somebody write the claim down where a reviewer sees it. These tests plant each kind of
violation and confirm it is caught, confirm look-alikes are left alone, and pin the baseline so it cannot grow quietly.
Run: python3 -m unittest scripts/tests/test_media_rights_gate.py -v
"""
import importlib.util
import json
import os
import subprocess
import sys
import unittest
from unittest import mock

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "media-rights-gate.py")
spec = importlib.util.spec_from_file_location("media_rights_gate", SCRIPT)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

BASELINE_CEILING = 532   # the number of media files on 2026-11-15. A new file gets a RECORD; raising this number is how a file would be blessed unseen.


def doc(**over):
    d = {"licences": ["owner-original", "owner-generated", "CC0-1.0", "CC-BY-4.0", "PD", "licensed-commercial"],
         "baseline": ["assets/old.mp4"], "records": []}
    d.update(over)
    return d


def rec(**over):
    r = {"path": "assets/new.mp3", "source": "recorded by the owner", "creator": "the owner", "licence": "owner-original",
         "evidence": "the owner made it", "added": "2026-11-16"}
    r.update(over)
    return r


class MediaRightsGate(unittest.TestCase):
    def test_a_baselined_file_passes(self):
        self.assertEqual(gate.evaluate(["assets/old.mp4"], doc()), [])

    def test_a_new_file_with_no_record_fails(self):
        out = gate.evaluate(["assets/old.mp4", "assets/film.mp4"], doc())
        self.assertEqual(len(out), 1)
        self.assertIn("assets/film.mp4", out[0])

    def test_every_media_kind_is_covered(self):
        for ext in (".mp3", ".wav", ".ogg", ".m4a", ".flac", ".mp4", ".webm", ".mov", ".jpg", ".png", ".webp", ".gif", ".svg", ".bmp", ".tif", ".tiff"):
            with self.subTest(ext):
                self.assertTrue(gate.evaluate(["assets/x" + ext], doc()), ext + " must need a record")

    def test_files_that_are_not_shipped_media_are_left_alone(self):
        for f in ["vendor/lib/sound.mp3", "docs/shot.png", "scripts/tests/fixture.jpg", "supabase/x.png", ".claude/skills/a/b.png",
                  "public/a.mp4", "index.html", "bg.js", "data.json"]:
            with self.subTest(f):
                self.assertEqual(gate.evaluate([f], doc()), [])

    def test_an_owner_made_record_passes(self):
        self.assertEqual(gate.evaluate(["assets/new.mp3"], doc(records=[rec()])), [])

    def test_someone_elses_licence_needs_a_url_evidence(self):
        bad = rec(licence="CC0-1.0", evidence="trust me")
        self.assertTrue(any("http(s) URL" in x for x in gate.evaluate(["assets/new.mp3"], doc(records=[bad]))))
        good = rec(licence="CC0-1.0", evidence="https://example.org/licence")
        self.assertEqual(gate.evaluate(["assets/new.mp3"], doc(records=[good])), [])

    def test_cc_by_needs_attribution(self):
        r = rec(licence="CC-BY-4.0", evidence="https://example.org/licence")
        self.assertTrue(any("attribution" in x for x in gate.evaluate(["assets/new.mp3"], doc(records=[r]))))
        r["attribution"] = "Song by A. Person, CC BY 4.0"
        self.assertEqual(gate.evaluate(["assets/new.mp3"], doc(records=[r])), [])

    def test_an_unknown_licence_is_refused(self):
        # give it a good URL as evidence, so the ONLY thing wrong is the licence: the allow-list itself must be what refuses it
        for lic in ("unknown", "TBD", "all rights reserved", "fair use", "royalty free", "personal use"):
            with self.subTest(lic):
                out = gate.evaluate(["assets/new.mp3"], doc(records=[rec(licence=lic, evidence="https://example.org/page")]))
                self.assertTrue(any("allowed licences" in x for x in out), out)
        self.assertTrue(gate.evaluate(["assets/new.mp3"], doc(records=[rec(licence="")])))

    def test_each_required_field_is_required(self):
        for k in gate.REQUIRED:
            with self.subTest(k):
                r = rec(); r[k] = "  "
                self.assertTrue(gate.evaluate(["assets/new.mp3"], doc(records=[r])), k)

    def test_a_bad_date_is_refused(self):
        self.assertTrue(gate.evaluate(["assets/new.mp3"], doc(records=[rec(added="last week")])))

    def test_a_stale_record_is_refused(self):
        out = gate.evaluate([], doc(records=[rec()]))
        self.assertTrue(any("stale" in x for x in out), out)

    def test_two_records_for_one_file_are_refused(self):
        out = gate.evaluate(["assets/new.mp3"], doc(records=[rec(), rec()]))
        self.assertTrue(any("second record" in x for x in out), out)

    # -- the real register -------------------------------------------------
    def test_the_real_repo_passes(self):
        r = subprocess.run([sys.executable, SCRIPT], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout[-1500:])

    def test_the_gate_can_actually_fail_on_the_real_register(self):
        with open(os.path.join(ROOT, "docs", "media-rights.json"), encoding="utf-8") as fh:
            real = json.load(fh)
        planted = gate.tracked_files() + ["assets/ripped-film.mp4"]
        self.assertTrue(gate.evaluate(planted, real), "a planted new video must fail against the real register")

    def test_the_baseline_cannot_grow_quietly(self):
        with open(os.path.join(ROOT, "docs", "media-rights.json"), encoding="utf-8") as fh:
            real = json.load(fh)
        self.assertLessEqual(len(real["baseline"]), BASELINE_CEILING,
                             "a new file gets a record in `records`; do not add it to the baseline")
        self.assertEqual(len(real["baseline"]), len(set(real["baseline"])), "duplicate baseline paths")

    def test_every_licence_note_names_an_allowed_licence(self):
        with open(os.path.join(ROOT, "docs", "media-rights.json"), encoding="utf-8") as fh:
            real = json.load(fh)
        for k in real["licence_notes"]:
            self.assertIn(k, real["licences"])

    def test_registered_in_contract_suite(self):
        with open(os.path.join(ROOT, "scripts", "contract-suite.py"), encoding="utf-8") as fh:
            self.assertIn("'scripts/media-rights-gate.py'", fh.read())


if __name__ == "__main__":
    unittest.main()
