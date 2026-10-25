"""Contract for the access-request alerts (migration 20261025100000, notify-access)."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
SQL = (ROOT / "supabase/migrations/20261025100000_access_request_alerts.sql").read_text(encoding="utf-8")
LOWER = SQL.lower()
FN = (ROOT / "supabase/functions/notify-access/index.ts").read_text(encoding="utf-8")
DOCK = (ROOT / "omega-command-dock.js").read_text(encoding="utf-8")


def body(name):
    start = LOWER.index(f"create or replace function {name}(")
    return LOWER[start:LOWER.index("$function$;", start)]


class AccessRequestAlertsContract(unittest.TestCase):
    def test_every_new_function_is_definer_with_empty_search_path_and_revoked(self):
        for name in ("private._notify_owner_access_requested", "private._dispatch_access_email",
                     "public.omega_notify_access_secret"):
            with self.subTest(name=name):
                fn = body(name)
                self.assertIn("security definer", fn)
                self.assertIn("set search_path to ''", fn)
                self.assertIn(f"revoke all on function {name}() from public, anon, authenticated", LOWER)

    def test_secret_reader_is_service_role_only(self):
        self.assertIn("grant execute on function public.omega_notify_access_secret() to service_role", LOWER)
        self.assertNotRegex(LOWER, r"grant execute on function public\.omega_notify_access_secret\(\) to (anon|authenticated)")
        self.assertIn("auth.role()", body("public.omega_notify_access_secret"))

    def test_side_effects_never_fail_the_profile_write(self):
        for name in ("private._notify_owner_access_requested", "private._dispatch_access_email"):
            with self.subTest(name=name):
                self.assertIn("exception when others then", body(name))
                self.assertIn("raise warning", body(name))

    def test_dispatch_is_dormant_without_vault_url_and_never_emails_a_trial(self):
        fn = body("private._dispatch_access_email")
        self.assertIn("name = 'notify_access_url'", fn)
        self.assertRegex(fn, r"if v_url is null or v_secret is null then\s+return new;")
        self.assertIn("coalesce(new.is_trial, false) is false", fn)
        self.assertNotIn("notify_access_url'", LOWER.split("create or replace function private._dispatch_access_email")[0])

    def test_no_secret_value_is_committed(self):
        self.assertNotRegex(SQL, r"[0-9a-f]{40,}")
        self.assertIn("gen_random_bytes(32)", LOWER)

    def test_function_authenticates_before_reading_payload(self):
        auth = FN.index("sameSecret(provided, expected)")
        self.assertLess(auth, FN.index("await req.json()"))
        self.assertIn("omega_notify_access_secret", FN)

    def test_member_email_is_dormant_without_verified_sender_and_html_is_escaped(self):
        self.assertIn('Deno.env.get("MEMBER_EMAIL_FROM")', FN)
        self.assertIn("member_email_sender_not_configured", FN)
        self.assertRegex(FN, r"const name = escHtml\(")
        for raw in re.findall(r"\$\{(m\.[a-z_]+)\}", FN):
            self.fail(f"unescaped member field interpolated into HTML: {raw}")

    def test_dock_reads_the_table_the_bell_reads(self):
        self.assertIn("sb.from('notifications')", DOCK)
        self.assertNotIn("from('omega_notifications')", DOCK)


if __name__ == "__main__":
    unittest.main()
