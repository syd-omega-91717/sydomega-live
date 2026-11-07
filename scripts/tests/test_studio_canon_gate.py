"""The Studios canon must only be served to an approved member, and must not also ship as a public static file.

The access decision lives in supabase/functions/_shared/studio-access.ts and is pure, so every case runs here under
real Node (type stripping), not a re-implementation in Python. Each deny case is a planted violation: if the predicate
were loosened, the matching test fails.
"""
import json
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
ACCESS = ROOT / "supabase" / "functions" / "_shared" / "studio-access.ts"
FUNC = ROOT / "supabase" / "functions" / "studio-canon" / "index.ts"
NOW = 1_800_000_000_000
FUTURE = "2027-06-01T00:00:00Z"
PAST = "2020-01-01T00:00:00Z"

SCRIPT = """
import { decideAccess } from %s;
const cases = JSON.parse(process.argv[1]);
console.log(JSON.stringify(cases.map(c => decideAccess(c.user, c.profile, c.err, %d))));
""" % (json.dumps(ACCESS.as_uri()), NOW)


def decide(cases):
    out = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", SCRIPT, json.dumps(cases)],
                         capture_output=True, text=True, timeout=60)
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout.strip().splitlines()[-1])


def case(profile, user="u1", err=False):
    return {"user": user, "profile": profile, "err": err}


@unittest.skipUnless(shutil.which("node"), "node is required")
class StudioCanonGate(unittest.TestCase):
    def test_allow_and_deny_matrix(self):
        approved = {"access_approved": True}
        matrix = [
            ("approved member", case(approved), True, None),
            ("owner", case({"is_owner": True}), True, None),
            ("owner even if flag false", case({"is_owner": True, "access_approved": False}), True, None),
            ("live trial", case({"access_approved": True, "is_trial": True, "trial_expires_at": FUTURE}), True, None),
            ("no caller", case(approved, user=None), False, 401),
            ("profile read failed, even if the row looked approved", case(approved, err=True), False, 503),
            ("no profile row", case(None), False, 403),
            ("not approved", case({"access_approved": False}), False, 403),
            ("approval unknown (null)", case({"access_approved": None}), False, 403),
            ("approval missing", case({}), False, 403),
            ("approval is a string, not true", case({"access_approved": "true"}), False, 403),
            ("rejected but still flagged approved", case({"access_approved": True, "is_rejected": True}), False, 403),
            ("expired trial", case({"access_approved": True, "is_trial": True, "trial_expires_at": PAST}), False, 403),
            ("trial with no expiry", case({"access_approved": True, "is_trial": True}), False, 403),
            ("trial with unreadable expiry", case({"access_approved": True, "is_trial": True, "trial_expires_at": "soon"}), False, 403),
        ]
        got = decide([m[1] for m in matrix])
        for (name, _, ok, status), v in zip(matrix, got):
            self.assertEqual(v["ok"], ok, name)
            if not ok:
                self.assertEqual(v["status"], status, name)

    def test_a_configured_function_requires_a_jwt_and_an_undeployed_one_is_not_configured(self):
        # supabase/config.toml decides what deploys on merge. The repo's contract lists only DEPLOYED functions there, so
        # studio-canon stays out until DEPLOY.md is followed; once it is in, it must never be verify_jwt = false.
        cfg = (ROOT / "supabase" / "config.toml").read_text(encoding="utf-8")
        snap = json.loads((ROOT / "docs" / "runtime" / "supabase-edge-functions-live.json").read_text(encoding="utf-8"))
        state = snap["functions"]["studio-canon"]["state"]
        m = re.search(r"\[functions\.studio-canon\]\s*\nverify_jwt\s*=\s*(\w+)", cfg)
        if state == "DEPLOYED":
            self.assertIsNotNone(m, "a DEPLOYED function must be configured")
        if m:
            self.assertEqual(m.group(1), "true")
        else:
            self.assertEqual(state, "LOCAL_ONLY", "not configured, so it cannot be recorded as deployed")

    def test_function_ignores_the_request_body_and_checks_before_serving(self):
        src = FUNC.read_text(encoding="utf-8")
        for bad in ("req.json", "req.text", "searchParams", "req.formData", "req.url"):
            self.assertNotIn(bad, src, "no caller input may choose what is served: " + bad)
        self.assertLess(src.index("decideAccess("), src.index("canon: WORLDS"), "the verdict must come before the payload")
        self.assertIn("verdict.ok", src)

    def test_the_canon_is_not_also_a_public_static_reference(self):
        # scripts/vercel-build.sh ships any /config/*.json a page or script names literally. The page must not name it.
        for f in ("worlds.html", "omega-worlds.js"):
            self.assertNotIn("/config/omega-studio-worlds.json", (ROOT / f).read_text(encoding="utf-8"), f)

    def test_the_page_asks_the_gated_function(self):
        self.assertIn("studio-canon", (ROOT / "omega-worlds.js").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
