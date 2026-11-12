"""supabase/functions/.env.example: complete, and never a real secret (#833).

The example is the one tracked place secret NAMES appear. It must list exactly
the variables the Edge Functions read (minus those the platform injects), and
every value must be an obvious placeholder -- so a real key pasted in fails CI.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FUNCS = ROOT / "supabase" / "functions"
EXAMPLE = FUNCS / ".env.example"
PLATFORM = {"SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_SECRET_KEY", "SUPABASE_SECRET_KEYS",
            "SB_EXECUTION_ID"}
PLACEHOLDER = re.compile(r"^(replace-me|)$")


def read_by_functions():
    names = set()
    for f in FUNCS.rglob("*.ts"):
        names |= set(re.findall(r"env\.get\(\s*['\"]([A-Z0-9_]+)['\"]", f.read_text(encoding="utf-8")))
    policy = json.loads((ROOT / "config" / "omega-ai-routing-policy.json").read_text(encoding="utf-8"))
    names |= {provider["credentialEnv"] for provider in policy["providers"].values()}
    profiles = policy["profiles"]
    patterns = policy["environment"]
    for profile in profiles:
        upper = profile.upper()
        names.add(patterns["providerPattern"].replace("{PROFILE}", upper))
        names.add(patterns["anthropicModelPattern"].replace("{PROFILE}", upper))
        names.add(patterns["openaiModelPattern"].replace("{PROFILE}", upper))
        names.add(patterns["openaiServiceTierPattern"].replace("{PROFILE}", upper))
    return names - PLATFORM


def example_entries():
    out = {}
    for line in EXAMPLE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip()
    return out


class EnvExample(unittest.TestCase):
    def test_lists_exactly_the_secrets_functions_read(self):
        self.assertEqual(set(example_entries()), read_by_functions())

    def test_every_value_is_a_placeholder(self):
        for k, v in example_entries().items():
            self.assertRegex(v, PLACEHOLDER, k)

    def test_real_env_files_are_ignored(self):
        gi = (ROOT / ".gitignore").read_text(encoding="utf-8").splitlines()
        self.assertIn(".env", gi)
        self.assertIn("!.env.example", gi)


if __name__ == "__main__":
    unittest.main()
