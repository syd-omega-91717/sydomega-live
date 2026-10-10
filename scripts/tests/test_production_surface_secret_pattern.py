"""The production-surface secret scan must catch real `sk-` keys and not prose.

Its unanchored `sk-` pattern matched "risk-management-framework" in a NIST URL
and failed main on a docs-only merge. The pattern is read from the script itself
so this test cannot drift from what the gate runs.
"""
import re
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "production-surface-contract.py"


def sk_pattern():
    src = SCRIPT.read_text(encoding="utf-8")
    m = re.search(r're\.compile\(r"([^"]*sk-[^"]*)"\)', src)
    assert m, "sk- pattern not found in production-surface-contract.py"
    return re.compile(m.group(1))


class SkKeyPattern(unittest.TestCase):
    def test_real_key_shapes_are_caught(self):
        pat = sk_pattern()
        for text in ('key = "sk-' + "A" * 24 + '"', "sk-ant-api03-" + "b" * 30, "\nsk-proj-" + "c" * 30):
            self.assertTrue(pat.search(text), text[:12])

    def test_words_ending_in_sk_are_not_keys(self):
        pat = sk_pattern()
        for text in ("https://www.nist.gov/itl/ai-risk-management-framework",
                     "a desk-management-and-scheduling-tool", "task-runner-orchestration-layer-x"):
            self.assertIsNone(pat.search(text), text)


if __name__ == "__main__":
    unittest.main()
