"""config/omega-relations.json: the evidence behind every line the one-shell map draws.

A line between two workspaces must be provable from the source. These tests hold three things: the committed file is what the
generator produces (so it cannot drift or be hand-edited into a claim), every edge carries evidence that is TRUE of the hub lists
(a shared page really is in both hubs), and the check has teeth (a planted edge with no evidence is refused).
"""
import copy
import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("relations_build", ROOT / "scripts" / "relations-build.py")
rb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rb)

DOC = json.loads((ROOT / "config" / "omega-relations.json").read_text(encoding="utf-8"))
SHELL = (ROOT / "omega-one-shell.js").read_text(encoding="utf-8")


def validate(doc, members):
    """Raise AssertionError for the first edge that is not backed by evidence."""
    hubs = set(doc["hubs"])
    seen = set()
    for e in doc["edges"]:
        assert e["a"] in hubs and e["b"] in hubs and e["a"] < e["b"], "unknown or unordered hub pair: %r" % e
        assert (e["a"], e["b"]) not in seen, "duplicate edge: %r" % e
        seen.add((e["a"], e["b"]))
        assert e["shared_pages"] or e["shared_relations"], "an edge with no evidence: %r" % e
        for p in e["shared_pages"]:
            assert p in members[e["a"]] and p in members[e["b"]], "%s is not listed in both %s and %s" % (p, e["a"], e["b"])
        assert e["weight"] == len(e["shared_pages"]) * 3 + len(e["shared_relations"]), "weight does not follow from the evidence: %r" % e


class RelationsTests(unittest.TestCase):
    def setUp(self):
        ws = rb.workspaces()
        self.members = {h: set([h] + pages) for h, pages in ws.items()}

    def test_the_committed_file_is_what_the_generator_produces(self):
        self.assertEqual(rb.render(rb.build()), (ROOT / "config" / "omega-relations.json").read_text(encoding="utf-8"),
                         "run: python3 scripts/relations-build.py")

    def test_every_edge_is_backed_by_evidence_that_is_true_of_the_hub_lists(self):
        validate(DOC, self.members)

    def test_the_validator_has_teeth(self):
        for mutate, why in (
            (lambda d: d["edges"].append({"a": "arena", "b": "vault", "weight": 0, "shared_pages": [], "shared_relations": []}), "no evidence"),
            (lambda d: d["edges"][0].update(shared_pages=["not-a-real-shared-page"], weight=3), "page not in both hubs"),
            (lambda d: d["edges"][0].update(weight=999), "weight not derived from evidence"),
            (lambda d: d["edges"].append(dict(d["edges"][0])), "duplicate edge"),
            (lambda d: d["edges"][0].update(a="zzz"), "unknown hub"),
        ):
            bad = copy.deepcopy(DOC)
            mutate(bad)
            with self.assertRaises(AssertionError, msg=why):
                validate(bad, self.members)

    def test_plumbing_does_not_connect_everything(self):
        out = DOC["excluded"]["plumbing_relations"]
        self.assertIn("table:profiles", out)
        used = {r for e in DOC["edges"] for r in e["shared_relations"]}
        self.assertFalse(used & set(out), "an excluded relation still appears as evidence")

    def test_the_hubs_are_the_workspace_hubs(self):
        self.assertEqual(set(DOC["hubs"]), set(rb.workspaces()))
        self.assertEqual(len(DOC["hubs"]), 15)

    def test_the_shell_draws_only_what_the_file_lists(self):
        self.assertIn("/config/omega-relations.json", SHELL)
        self.assertIn("((rel && rel.edges) || []).forEach(function (e) {", SHELL, "edges must come from the loaded file")
        self.assertIn("rel = r[3];", SHELL)
        # no hand-written pair of hubs anywhere in the shell
        self.assertNotRegex(SHELL, r"\b(a|b)\s*:\s*'(ascend|achieve|dashboard|cosmos|life|profile)'", "an edge must not be written into the shell")

    def test_no_data_ever_becomes_markup(self):
        # the evidence strings are file data: they must reach the page as text nodes only
        for sink in (r"\.innerHTML", r"\.outerHTML", r"insertAdjacentHTML", r"document\.write", r"createContextualFragment"):
            self.assertIsNone(re.search(sink, SHELL), sink)

    def test_the_readout_is_not_clamped_by_the_read_more_module(self):
        self.assertIn("read.setAttribute('data-no-clamp', '')", SHELL)


if __name__ == "__main__":
    unittest.main()
