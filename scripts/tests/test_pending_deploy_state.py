"""PENDING_DEPLOY: a function configured to deploy on the next merge, not yet seen live.

It must be held to the same source-drift and auth/config rules as a DEPLOYED function, and must never be a way to slip an
unconfigured or unregistered function past the contracts. Each test builds a tiny fake repository and runs the real
contract main() against it.
"""
import contextlib
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


REC = load("rec", "supabase-edge-runtime-reconciliation.py")
AUTH = load("auth", "edge-function-auth-config-contract.py")
_KEEP = []  # a TemporaryDirectory is deleted when collected; keep each fake repo alive for its test
SRC = "Deno.serve(() => new Response('ok'));\n"


def run(mod):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        code = mod.main()
    return code, buf.getvalue()


class Fake:
    def __init__(self, state="PENDING_DEPLOY", sha="auto", configured=True, registered=True, snapshot_verify=True):
        self.tmp = tempfile.TemporaryDirectory()
        _KEEP.append(self)
        r = pathlib.Path(self.tmp.name)
        (r / "supabase" / "functions" / "fn").mkdir(parents=True)
        (r / "supabase" / "functions" / "fn" / "index.ts").write_text(SRC)
        (r / "docs" / "runtime").mkdir(parents=True)
        (r / "config").mkdir()
        blob = REC.git_blob_sha(r / "supabase" / "functions" / "fn" / "index.ts")
        meta = {"state": state, "verify_jwt": snapshot_verify}
        if sha == "auto":
            meta["repository_blob_sha"] = blob
        elif sha:
            meta["repository_blob_sha"] = sha
        (r / "docs" / "runtime" / "live.json").write_text(json.dumps({"functions": {"fn": meta}}))
        (r / "config" / "auth.json").write_text(json.dumps({"functions": {"fn": {"verify_jwt": True, "auth_mode": "SUPABASE_JWT"}} if registered else {}}))
        (r / "supabase" / "config.toml").write_text("[functions.fn]\nverify_jwt = true\n" if configured else "")
        self.root = r

    def patch(self):
        REC.FUNCTIONS = self.root / "supabase" / "functions"
        REC.SNAPSHOT = self.root / "docs" / "runtime" / "live.json"
        AUTH.FUNCTIONS = REC.FUNCTIONS
        AUTH.SNAPSHOT = REC.SNAPSHOT
        AUTH.CONFIG = self.root / "supabase" / "config.toml"
        AUTH.AUTH_REGISTRY = self.root / "config" / "auth.json"
        AUTH.ROOT = self.root
        return self


class PendingDeploy(unittest.TestCase):
    def test_a_pending_function_that_is_configured_and_registered_passes_both(self):
        f = Fake().patch()
        self.assertEqual(run(REC)[0], 0)
        self.assertEqual(run(AUTH)[0], 0)
        self.assertIn("pending_deploy=1", run(REC)[1])

    def test_source_drift_after_recording_is_caught(self):
        f = Fake().patch()
        (f.root / "supabase" / "functions" / "fn" / "index.ts").write_text(SRC + "// changed\n")
        code, out = run(REC)
        self.assertEqual(code, 1)
        self.assertIn("deployed source changed", out)

    def test_pending_without_a_recorded_blob_sha_is_rejected(self):
        Fake(sha=None).patch()
        code, out = run(REC)
        self.assertEqual(code, 1)
        self.assertIn("requires repository_blob_sha", out)

    def test_pending_but_not_in_config_is_rejected(self):
        Fake(configured=False).patch()
        code, out = run(AUTH)
        self.assertEqual(code, 1)
        self.assertIn("config.toml", out)

    def test_pending_but_not_in_the_auth_registry_is_rejected(self):
        Fake(registered=False).patch()
        code, out = run(AUTH)
        self.assertEqual(code, 1)
        self.assertIn("auth registry", out)

    def test_local_only_in_config_is_still_rejected(self):
        Fake(state="LOCAL_ONLY", sha=None).patch()
        code, out = run(AUTH)
        self.assertEqual(code, 1)
        self.assertIn("extra=['fn']", out)

    def test_an_unknown_state_is_still_rejected(self):
        Fake(state="LIVE").patch()
        self.assertEqual(run(REC)[0], 1)


if __name__ == "__main__":
    unittest.main()
