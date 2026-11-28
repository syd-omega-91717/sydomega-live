"""The no-biometric gate (scripts/no-biometric-gate.py) must find each thing it exists to find, stay silent on the look-alikes the platform legitimately has, and be clean on the repo.

A scanner that reports 0 proves nothing until it has found something it must find, so each of the three classes (schema, library, copy) is planted in a scratch tree here. The
look-alikes are real ones from this repo: the DNA lore pages, secret-fingerprint hashes, a code comment recording a fake biometric that was removed."""
import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("nbg", ROOT / "scripts" / "no-biometric-gate.py")
nbg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nbg)


def tree(files):
    d = tempfile.mkdtemp()
    for rel, text in files.items():
        p = pathlib.Path(d, rel)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
    return d


def found(files):
    return nbg.scan(tree(files))


class MustFind(unittest.TestCase):
    def test_schema_naming_a_biometric_or_genetic_datum(self):
        for sql in ("create table profiles (id uuid, biometric_hash text);", "alter table t add column face_embedding vector(128);", "create table dna_samples (id int);",
                    "create table x (voiceprint bytea);", "create table y (user_genome jsonb);"):
            f = found({"supabase/migrations/001.sql": sql})
            self.assertTrue(any("schema" in w for _, _, w, _ in f), sql)

    def test_a_face_recognition_or_device_fingerprinting_library(self):
        for js in ("import * as faceapi from 'face-api.js';", "const d = new FaceDetector();", "import FingerprintJS from '@fingerprintjs/fingerprintjs';"):
            f = found({"supabase/functions/x/index.ts": js})
            self.assertTrue(any("library" in w for _, _, w, _ in f), js)
            g = found({"app.js": js})
            self.assertTrue(any("library" in w for _, _, w, _ in g), js)

    def test_copy_that_says_a_biometric_dna_or_hsm_identity_is_real(self):
        for s in ('"tier_4_desc":"HSM biometric linked. Full succession rights."', '<p>Sign in with your fingerprint scan and unlock the vault.</p>',
                  '<p>Your DNA verifies your identity at login.</p>', "<p>Face ID authenticates every owner action.</p>", '<p>Retinal scan verified.</p>'):
            f = found({"page.html": s})
            self.assertTrue(any("copy" in w for _, _, w, _ in f), s)


class MustStaySilent(unittest.TestCase):
    def test_the_platforms_own_dna_lore(self):
        for s in ("<div>SOURCE-DNA SOLAR SYSTEM LEDGER</div>", "<p>The DNA Code is a compressed sovereign identifier: Omega.FIRE.VII.MID.18.45</p>",
                  "{label:'Sovereign DNA', section:'IDENTITY', prev:'passport'}", "<b>VISUAL DNA: GHOST FIREWALL</b>"):
            self.assertEqual(found({"page.html": s}), [], s)

    def test_a_secret_fingerprint_hash_and_ordinary_science_copy(self):
        self.assertEqual(found({"supabase/migrations/002.sql": "create table keys (id int, key_fingerprint text);"}), [])
        self.assertEqual(found({"c.json": '"Per-function provider secret presence/fingerprint is verified without storing secret values."'}), [])
        self.assertEqual(found({"b.html": "<p>Twin studies show heritability. Identifying cognitive strengths in lineage helps. Genes are a starting hand.</p>"}), [])

    def test_copy_that_says_it_is_a_concept_or_that_the_biometric_stays_on_the_device(self):
        for s in ("<p>Concept only. No HSM biometric, succession, or inheritance workflow is implemented.</p>", "<p>Passkeys: your fingerprint scan stays on your device; we store only a public key.</p>",
                  "// the first version printed PALM_PRINT: VERIFIED / RETINAL_SCAN_MATCH on a screen", "<p>A face id sign-in is planned and would use a passkey.</p>"):
            self.assertEqual(found({"page.html": s}), [], s)

    def test_a_long_line_of_unrelated_entries_does_not_pair_a_slug_with_a_distant_verb(self):
        line = "related:['profile','identity','dna']}, 'settings':{purpose:'Preferences'," + "x" * 200 + "action:'Verify'}"
        self.assertEqual(found({"m.js": line}), [])

    def test_docs_and_tests_may_discuss_the_subject(self):
        self.assertEqual(found({"docs/plan.md": "biometric linked", "scripts/tests/t.py": "face-api", "vendor/x.js": "face-api"}), [])


class OnTheRepo(unittest.TestCase):
    def test_the_repo_is_clean(self):
        self.assertEqual(nbg.scan(str(ROOT)), [])

    def test_the_dead_biometric_tier_strings_are_gone_from_every_language(self):
        for p in [ROOT / "i18n.js"] + sorted((ROOT / "i18n").glob("*.json")):
            t = p.read_text(encoding="utf-8")
            self.assertNotIn("profile_sec_tier_4_desc", t, p.name)
            self.assertNotIn("kyc_tier_4_desc", t, p.name)


if __name__ == "__main__":
    unittest.main()
