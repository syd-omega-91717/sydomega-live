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
        for f in ("0085_permanent_access_policy.sql", "20260927143525_guard_profile_trial_expiry.sql"):
            g = read("supabase", "migrations", f)
            body = g[g.index("function public.guard_profile_privileges"):]
            body = body[:body.index("$$", body.index("$$") + 2)] if "$$" in body else body
            self.assertNotIn("kyc_", body, f)


class Client(unittest.TestCase):
    def test_passport_client_is_defined(self):
        self.assertRegex(PROFILE, r"\bvar ppSb\s*=\s*sb;")

    def test_no_direct_kyc_write(self):
        self.assertNotRegex(PROFILE, r"from\('profiles'\)\.update\(\{kyc_status")
        self.assertIn("ppSb.rpc('submit_kyc',{p_doc_path:path,p_consent:true})", PROFILE)

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


RET = read("supabase", "migrations", "20260927124007_kyc_retention_consent.sql")
ERASE = read("supabase", "migrations", "20260927142646_kyc_erasure_guard.sql")
GUARD = read("supabase", "migrations", "20260927143525_guard_profile_trial_expiry.sql")
NOTIF = read("supabase", "migrations", "20260927143903_notifications_fill_required.sql")
UPLOAD = read("upload.js")
PRIVACY = read("privacy.html")
SETTINGS = read("settings.html")
UI = read("approvals-ui.js")


def fn_body(src, name):
    b = src[src.index("function " + name):]
    return b[:b.index("end $$") if "end $$" in b else b.index("$$;", b.index("$$") + 2)]


class Retention(unittest.TestCase):
    """Round 3: the document lives only while it waits for review
    (20260927124007_kyc_retention_consent.sql, privacy.html#identity-documents)."""

    def test_consent_required_before_anything_else_is_recorded(self):
        body = fn_body(RET, "private.submit_kyc")
        self.assertIn("if p_consent is not true then", body)
        self.assertLess(body.index("consent_required"), body.index("update public.profiles"))
        self.assertIn("kyc_consent_at = now()", body)
        self.assertIn("drop function if exists public.submit_kyc(text);", RET)

    def test_verdict_hands_back_the_document_for_deletion(self):
        self.assertIn("'purge', doc", fn_body(RET, "private.review_kyc"))

    def test_purge_is_confirmed_by_the_server(self):
        body = fn_body(RET, "private.kyc_document_purged")
        self.assertIn("private.is_platform_owner()", body[:body.index("select kyc_status")])
        self.assertIn("'still_stored'", body)
        self.assertIn("'no_verdict'", body)

    def test_withdraw_only_after_the_file_is_gone(self):
        body = fn_body(RET, "private.withdraw_kyc")
        self.assertLess(body.index("'still_stored'"), body.index("update public.profiles"))

    def test_queue_lists_undeleted_documents(self):
        self.assertIn("'purge', coalesce(", fn_body(RET, "private.kyc_queue"))

    def test_owner_delete_policy_is_owner_only(self):
        self.assertIn("using (bucket_id = 'uploads' and (select private.is_platform_owner()));", RET)

    def test_new_functions_not_executable_by_anon(self):
        for sig in ("public.submit_kyc(text, boolean)", "public.kyc_document_purged(uuid)",
                    "public.withdraw_kyc()", "public.owner_set_kyc_intake(boolean)"):
            self.assertIn("revoke execute on function %s from public, anon;" % sig, RET)

    def test_erasure_and_delete_never_strand_a_document(self):
        for fn in ("private.delete_account", "private.request_account_erasure"):
            m = re.search(r"function %s\(\).*?\$\$(.*?)\$\$;" % re.escape(fn), ERASE, re.S)
            self.assertIsNotNone(m, fn)
            body = m.group(1)
            self.assertIn("'identity_document_stored'", body, fn)
            self.assertLess(body.index("identity_document_stored"), body.index("UPDATE public.profiles") if "UPDATE public.profiles" in body else body.index("DELETE FROM public.task_completions"), fn)


class Client3(unittest.TestCase):
    def test_consent_box_gates_the_upload(self):
        body = PROFILE[PROFILE.index("async function submitKyc()"):]
        self.assertLess(body.index("consentEl.checked"), body.index("OmegaStorage.upload("))
        self.assertIn('href="/privacy.html#identity-documents"', PROFILE)

    def test_withdraw_deletes_through_storage_then_asks_again(self):
        self.assertIn("clearIdentityDocThen(function(){ return ppSb.rpc('withdraw_kyc'); })", PROFILE)
        helper = UPLOAD[UPLOAD.index("clearIdentityDocThen:"):]
        helper = helper[:helper.index("\n    },")]
        self.assertIn("this.remove('uploads',d.doc_path)", helper)
        self.assertEqual(helper.count("await call()"), 2)

    def test_erasure_paths_use_the_helper(self):
        self.assertIn("return sb.rpc('request_account_erasure');", PRIVACY)
        self.assertIn("clearIdentityDocThen(call)", PRIVACY)
        self.assertIn("clearIdentityDocThen(call)", SETTINGS)
        for page in (PRIVACY, SETTINGS):
            self.assertIn('<script src="/upload.js"></script>', page)

    def test_privacy_notice_states_the_rule(self):
        sec = PRIVACY[PRIVACY.index('id="identity-documents"'):PRIVACY.index("</section>")]
        for term in ("WHO SEES IT", "HOW LONG", "WITHDRAW", "60 seconds", "deleted"):
            self.assertIn(term, sec)
        self.assertNotIn("Supabase EU region", PRIVACY)   # project is ap-southeast-1

    def test_verdict_deletes_and_owner_can_retry(self):
        v = APPROVALS[APPROVALS.index("async function kycVerdict("):APPROVALS.index("async function kycIntake(")]
        self.assertIn("kycPurge(uid,d.purge,true)", v)
        self.assertIn("sb.storage.from('uploads').remove([path])", v)
        self.assertIn("sb.rpc('kyc_document_purged',{p_member:uid})", v)
        self.assertIn("sb.rpc('owner_set_kyc_intake',{p_on:!!on})", APPROVALS)
        for a in ("kycPurge:", "kycIntake:"):
            self.assertIn(a, UI)


class PlatformWrites(unittest.TestCase):
    """Found while verifying erasure: two live bugs that failed every write
    through them (FIXES_LOG)."""

    def test_guard_literals_are_typed(self):
        self.assertNotRegex(GUARD, r"changed \|\| '[a-z_]+';")
        self.assertIn("changed || 'access_approved'::text", GUARD)

    def test_guard_allows_only_downgrades(self):
        self.assertIn("coalesce(new.access_approved,false) and not coalesce(old.access_approved,false)", GUARD)
        self.assertIn("coalesce(new.is_owner,false)             is distinct from coalesce(old.is_owner,false)", GUARD)
        self.assertIn("not (new.trial_expires_at is null and not coalesce(new.is_trial,false))", GUARD)

    def test_notifications_fill_required_columns(self):
        self.assertIn("before insert on public.notifications", NOTIF)
        self.assertIn("new.title := coalesce(", NOTIF)
        self.assertIn("new.type := coalesce(", NOTIF)

    def test_owner_notices_reach_every_owner_and_never_block(self):
        self.assertNotIn("s.y.dagher@gmail.com", NOTIF)
        self.assertEqual(NOTIF.count("from public.platform_owners po"), 2)
        self.assertEqual(NOTIF.count("exception when others then"), 2)


if __name__ == "__main__":
    unittest.main()
