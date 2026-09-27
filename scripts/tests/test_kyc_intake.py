#!/usr/bin/env python3
"""
KYC document intake -- docs/decisions/kyc-intake/PLAN.md,
supabase/migrations/20260927110344_kyc_intake_rpcs.sql.

Two failures stacked on this flow, both measured:
  - profile.html's Passport code called `ppSb`, which nothing ever defined, so
    bootPassportExtra() threw ReferenceError on open (pinned previous version:
    "THREW ppSb is not defined");
  - behind that, the page wrote kyc_* columns directly, which members cannot
    (and must not) update: every submission would have failed with 42501, after
    the identity document had already been uploaded.

These tests hold the fix's rules:
  - the only write path is the RPC; the page never writes kyc_* itself;
  - intake ships closed behind kyc_intake_enabled and the RPC re-checks it;
  - the server checks own-folder path, object ownership, approval and state;
    owner functions check is_platform_owner() first; anon gets no EXECUTE;
  - an upload the server refuses is removed (no orphaned identity document);
  - owner review renders names with textContent and opens documents through a
    short signed URL.

Live evidence (rolled-back impersonation block) is in the migration header.

Run: python3 -m unittest scripts/tests/test_kyc_intake.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(*p):
    with open(os.path.join(ROOT, *p), encoding="utf-8") as f:
        return f.read()


MIG = read("supabase", "migrations", "20260927110344_kyc_intake_rpcs.sql")
PROFILE = read("profile.html")
APPROVALS = read("approvals.js")


class Server(unittest.TestCase):
    def test_flag_ships_off_and_is_checked(self):
        self.assertIn("values ('kyc_intake_enabled', false, now())", MIG)
        self.assertIn("on conflict (key) do nothing", MIG)
        self.assertIn("private.get_platform_flag('kyc_intake_enabled')", MIG)

    def test_submit_checks(self):
        body = MIG[MIG.index("function private.submit_kyc"):MIG.index("function private.review_kyc")]
        self.assertIn("'/[^/]{1,255}$'", body)          # Postgres caps repetition at 255
        self.assertIn("o.owner_id = uid::text", body)
        self.assertIn("'not_approved'", body)
        self.assertIn("'already_verified'", body)
        self.assertIn("for update", body)
        self.assertNotIn("p_member", body)             # acts on auth.uid() only

    def test_owner_functions_guarded_first(self):
        for fn in ("private.review_kyc", "private.kyc_queue"):
            body = MIG[MIG.index("function " + fn):]
            begin = body.index("begin")
            first = body[begin:begin + 200]
            self.assertIn("private.is_platform_owner()", first, fn)

    def test_verdict_only_from_submitted(self):
        self.assertIn("if cur is distinct from 'submitted'", MIG)
        self.assertIn("p_verdict not in ('verified', 'rejected')", MIG)

    def test_execute_revoked_from_public_and_anon(self):
        for sig in ("private.submit_kyc(text)", "private.review_kyc(uuid, text)", "private.kyc_queue()",
                    "public.submit_kyc(text)", "public.review_kyc(uuid, text)", "public.kyc_queue()"):
            self.assertIn("revoke execute on function %s from public, anon;" % sig, MIG)

    def test_exposed_wrappers_are_invoker(self):
        for fn in ("submit_kyc", "review_kyc", "kyc_queue"):
            m = re.search(r"create or replace function public\.%s\([^)]*\)\s*returns jsonb language sql[^\n]*security invoker" % fn, MIG)
            self.assertIsNotNone(m, fn)

    def test_guard_trigger_still_omits_kyc(self):
        # submit_kyc relies on guard_profile_privileges not blocking kyc_*.
        g = read("supabase", "migrations", "0085_permanent_access_policy.sql")
        body = g[g.index("function public.guard_profile_privileges"):]
        body = body[:body.index("$$", body.index("$$") + 2)] if "$$" in body else body
        self.assertNotIn("kyc_", body)


class Client(unittest.TestCase):
    def test_passport_client_is_defined(self):
        self.assertRegex(PROFILE, r"\bvar ppSb\s*=\s*sb;")

    def test_no_direct_kyc_write(self):
        self.assertNotRegex(PROFILE, r"from\('profiles'\)\.update\(\{kyc_status")
        self.assertIn("ppSb.rpc('submit_kyc',{p_doc_path:path})", PROFILE)

    def test_refused_upload_is_removed(self):
        body = PROFILE[PROFILE.index("async function submitKyc()"):]
        body = body[:body.index("\n}\n")]
        refuse = body.index("if(r.error || res.ok!==true){")
        self.assertIn("OmegaStorage.remove('uploads',path)", body[refuse:refuse + 400])
        self.assertIn("OmegaStorage.remove('uploads',res.replaced)", body)

    def test_intake_checked_before_upload(self):
        body = PROFILE[PROFILE.index("async function submitKyc()"):]
        self.assertLess(body.index("kycIntakeOpen()"), body.index("OmegaStorage.upload("))

    def test_owner_review(self):
        self.assertIn("sb.rpc('kyc_queue')", APPROVALS)
        self.assertIn("createSignedUrl(path,60)", APPROVALS)
        body = APPROVALS[APPROVALS.index("async function loadKyc()"):APPROVALS.index("async function kycView(")]
        self.assertNotIn("innerHTML", body)
        self.assertIn("d.ok!==true", APPROVALS)


if __name__ == "__main__":
    unittest.main()
