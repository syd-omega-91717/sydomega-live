"""The fabric audit must observe the repository, not merely run to completion.

Every assertion here plants a violator first. A gate whose failing branch is
never exercised reports a serene zero forever -- CLAUDE.md 8.4, and the exact
shape of the defect this audit replaced: a nine-file existence check that
printed PASS while the platform's front door served 404 in production.
"""
import contextlib
import importlib
import importlib.util
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# scripts/ is not a package; load the module by path so the test does not
# depend on an __init__.py that the repository deliberately does not have.
_spec = importlib.util.spec_from_file_location(
    "omega_fabric_audit", ROOT / "scripts" / "omega_fabric_audit.py")
audit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(audit)


@contextlib.contextmanager
def repo_root_at(tmp: Path):
    """Point the audit at a scratch copy so a violator never touches the repo."""
    original = audit.ROOT
    audit.ROOT = tmp
    try:
        yield
    finally:
        audit.ROOT = original


@contextlib.contextmanager
def scratch_repo():
    """A minimal copy of the files every evidence point reads."""
    tmp = Path(tempfile.mkdtemp(prefix="omega-fabric-"))
    try:
        for rel in ("vercel.json", "omega-agents.json", "index.html",
                    "docs/capabilities/registry.json",
                    "supabase/live-schema.json",
                    "supabase/remote-migrations.json"):
            dest = tmp / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(ROOT / rel, dest)
        for rel in audit.FABRIC_FILES:
            dest = tmp / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(ROOT / rel, dest)
        # Every capability entrypoint page, as an empty stand-in: RND-01 asserts
        # the file is on disk, never its contents.
        registry = json.loads(
            (tmp / "docs/capabilities/registry.json").read_text(encoding="utf-8"))
        for cap in registry.get("capabilities") or []:
            for entry in cap.get("entrypoints") or []:
                if entry.endswith(".html"):
                    (tmp / entry).parent.mkdir(parents=True, exist_ok=True)
                    (tmp / entry).touch()
        with repo_root_at(tmp):
            yield tmp
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def state_of(point_id: str) -> str:
    matrix, _fabric, _skills = audit.build_matrix()
    return matrix.get(point_id).state.value


def edit_json(path: Path, mutate):
    data = json.loads(path.read_text(encoding="utf-8"))
    mutate(data)
    path.write_text(json.dumps(data, indent=1), encoding="utf-8")


class FabricAuditControlTests(unittest.TestCase):
    def test_the_repository_itself_passes(self):
        self.assertEqual(audit.main([]), 0)

    def test_front_door_fails_without_index_html(self):
        with scratch_repo() as tmp:
            self.assertEqual(state_of("SRC-01"), "VERIFIED")
            (tmp / "index.html").unlink()
            self.assertEqual(state_of("SRC-01"), "FAILED")

    def test_front_door_degrades_when_a_root_rewrite_shadows_the_file(self):
        # The arrangement that returned HTTP 404 live on 2026-09-05: the file
        # may exist and still not be what the deployment serves.
        with scratch_repo() as tmp:
            edit_json(tmp / "vercel.json", lambda d: d.__setitem__(
                "rewrites", [{"source": "/", "destination": "/index.html"}]))
            self.assertEqual(state_of("SRC-01"), "PARTIAL")

    def test_fabric_structure_fails_on_a_missing_module(self):
        with scratch_repo() as tmp:
            (tmp / "core/intelligence_fabric/policy_firewall.py").unlink()
            self.assertEqual(state_of("SRC-02"), "FAILED")

    def test_fabric_structure_fails_on_a_syntax_error(self):
        with scratch_repo() as tmp:
            (tmp / "core/intelligence_fabric/model_router.py").write_text(
                "def broken(:\n", encoding="utf-8")
            self.assertEqual(state_of("SRC-02"), "FAILED")

    def test_capability_contract_fails_when_a_field_is_emptied(self):
        with scratch_repo() as tmp:
            def blank(d):
                d["capabilities"][0]["contract"]["failure_path"] = ""
            edit_json(tmp / "docs/capabilities/registry.json", blank)
            self.assertEqual(state_of("SRC-03"), "FAILED")

    def test_agent_binding_fails_on_an_empty_roster(self):
        with scratch_repo() as tmp:
            edit_json(tmp / "omega-agents.json",
                      lambda d: d.__setitem__("agents", []))
            self.assertEqual(state_of("SRC-04"), "FAILED")

    def test_agent_binding_uses_the_real_roster(self):
        _matrix, fabric, skills = audit.build_matrix()
        self.assertEqual(len(fabric.agents), 12, "the 12-agent roster must bind")
        self.assertTrue(skills.inventory(), "domains must produce governed skills")

    def test_render_plane_never_claims_a_render_it_did_not_perform(self):
        # No browser in this process, so RND-01 must stay UNVERIFIED. Reporting
        # VERIFIED here would be a fabricated proof (CLAUDE.md 8.1 class 9).
        self.assertEqual(state_of("RND-01"), "UNVERIFIED")

    def test_render_plane_fails_when_an_entrypoint_file_is_absent(self):
        with scratch_repo() as tmp:
            def point_nowhere(d):
                d["capabilities"][0]["entrypoints"] = ["no-such-page.html"]
            edit_json(tmp / "docs/capabilities/registry.json", point_nowhere)
            self.assertEqual(state_of("RND-01"), "FAILED")

    def test_stale_snapshot_degrades_but_does_not_block(self):
        with scratch_repo() as tmp:
            edit_json(tmp / "supabase/live-schema.json",
                      lambda d: d.__setitem__("_captured", "2020-01-01"))
            self.assertEqual(state_of("LIVE-01"), "PARTIAL")
            # Staleness is a known-unknown, not a defect: the gate still exits 0.
            self.assertEqual(audit.main([]), 0)

    def test_blocked_live_verification_is_reported_as_partial(self):
        with scratch_repo() as tmp:
            def block(d):
                d["capabilities"][0]["contract"]["live_verification"] = \
                    "BLOCKED - no database reached"
            edit_json(tmp / "docs/capabilities/registry.json", block)
            self.assertEqual(state_of("LIVE-03"), "PARTIAL")

    def test_json_output_parses_and_carries_every_point(self):
        import io
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = audit.main(["--json"])
        self.assertEqual(rc, 0)
        payload = json.loads(buf.getvalue())
        self.assertEqual(len(payload["points"]), 9)
        self.assertEqual(payload["agents"], 12)


class HelpContractTests(unittest.TestCase):
    def test_help_prints_the_docstring_and_does_no_work(self):
        # The previous version of this script ran its whole job on --help,
        # which is what turned scripts/tests/test_script_help_contract.py red.
        import subprocess
        out = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "omega_fabric_audit.py"), "--help"],
            capture_output=True, text=True, timeout=60,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"})
        self.assertEqual(out.returncode, 0)
        self.assertIn("Usage: python3 scripts/omega_fabric_audit.py", out.stdout)
        # The docstring itself quotes the old `FABRIC_AUDIT=PASS files=9` line,
        # so its mere presence proves nothing. What proves --help did no work is
        # the absence of the report the run would have printed.
        self.assertNotIn("evidence matrix\n  boundary:", out.stdout)
        self.assertNotIn("SRC-01", out.stdout)


if __name__ == "__main__":
    unittest.main()
