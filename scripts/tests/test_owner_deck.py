#!/usr/bin/env python3
"""
The owner deck (omega-owner-deck.js on control-plane.html) promises "every page
in one place". It holds no copy of the page list: pages come from nav.js's
SECTIONS, then the control-plane REGISTRY, then the deck's own EXTRA list for
the pages neither knows. This test fails the moment a page file exists that
none of the three reaches, so adding a page without wiring it cannot silently
drop it from the deck.

Run: python3 -m unittest scripts/tests/test_owner_deck.py -v
"""

import glob
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


def nav_slugs():
    # sub entries look like ['key','LABEL','/page.html'] (optionally a 4th field)
    return {m.group(1) for m in re.finditer(r"'/([a-z0-9-]+)\.html(?:#[^']*)?'", read("nav.js"))}


def registry_slugs():
    src = read("omega-control-plane.js")
    start = src.index("const REGISTRY")
    return set(re.findall(r"'([a-z0-9-]+)':\{purpose:", src[start:]))


def extra_slugs():
    src = read("omega-owner-deck.js")
    block = src[src.index("var EXTRA = ["):src.index("];", src.index("var EXTRA = ["))]
    return set(re.findall(r"\['([a-z0-9-]+)',", block))


class OwnerDeckCoverage(unittest.TestCase):
    def test_every_page_file_reaches_the_deck(self):
        pages = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "*.html"))}
        covered = nav_slugs() | registry_slugs() | extra_slugs()
        missing = sorted(pages - covered)
        self.assertEqual(missing, [], "pages the owner deck cannot reach: %s" % missing)

    def test_extra_lists_only_real_pages(self):
        pages = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "*.html"))}
        ghosts = sorted(extra_slugs() - pages)
        self.assertEqual(ghosts, [], "EXTRA names pages that do not exist: %s" % ghosts)

    def test_registry_names_only_real_pages(self):
        # security/upload once sat here with no page behind them: 404 tiles.
        pages = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "*.html"))}
        ghosts = sorted(registry_slugs() - pages)
        self.assertEqual(ghosts, [], "registry names pages that do not exist: %s" % ghosts)

    def test_parsers_see_real_data(self):
        # A regex damaged in transit reads 0 and would make the first test vacuous.
        self.assertGreater(len(nav_slugs()), 150)
        self.assertGreater(len(registry_slugs()), 100)
        self.assertGreater(len(extra_slugs()), 5)

    def test_control_plane_mounts_the_deck(self):
        html = read("control-plane.html")
        self.assertIn("/omega-owner-deck.js", html)
        self.assertIn("data-omega-owner-deck", html)


def run_open_items(cases):
    """Evaluate the deck's own openItems() in node, lifted from the file, so
    the test exercises the shipped logic rather than a copy of it."""
    import json
    import subprocess
    src = read("omega-owner-deck.js")
    days = re.search(r"var ROTATE_DAYS = \d+;", src).group(0)
    start = src.index("function openItems(st) {")
    end = src.index("\n  }\n", start) + 4
    prog = days + "\n" + src[start:end] + (
        "\nconst cases=%s;process.stdout.write(JSON.stringify(cases.map(openItems)));" % json.dumps(cases))
    out = subprocess.run(["node", "-e", prog], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


class SecurityChecklist(unittest.TestCase):
    """The checklist shows only what is still open, and each item clears on
    evidence (a verified factor, a recorded rotation) -- never on a guess."""

    def iso(self, days_ago):
        import datetime
        t = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago)
        return t.strftime("%Y-%m-%dT%H:%M:%SZ")

    def test_items_open_and_clear_on_evidence(self):
        a = {"email": "a@x.com", "me": True, "factors": 0}
        b = {"email": "b@x.com", "me": False, "factors": 0}
        a_ok, b_ok = dict(a, factors=1), dict(b, factors=2)
        got = run_open_items([
            {"owners": [a, b], "secrets_rotated_at": None},
            {"owners": [a_ok, b_ok], "secrets_rotated_at": self.iso(10), "owner_mfa_required": True},
            {"owners": [a_ok, b], "secrets_rotated_at": self.iso(10)},
            {"owners": [a_ok, b_ok], "secrets_rotated_at": self.iso(200), "owner_mfa_required": True},
            {"owners": [a_ok, b_ok], "secrets_rotated_at": "not a date", "owner_mfa_required": True},
            {"owners": [], "secrets_rotated_at": self.iso(1)},
            {"owners": [a_ok, b_ok], "secrets_rotated_at": self.iso(10), "owner_mfa_required": None},
        ])
        self.assertEqual([i["kind"] for i in got[0]], ["mfa", "mfa", "keys"])
        self.assertEqual([(i["who"], i["me"]) for i in got[0][:2]], [("a", True), ("b", False)])
        self.assertEqual(got[1], [], "everything done must draw nothing")
        self.assertEqual(got[2], [{"kind": "mfa", "me": False, "who": "b"}])
        self.assertEqual([i["kind"] for i in got[3]], ["keys"], "a stale rotation must reopen")
        self.assertEqual([i["kind"] for i in got[4]], ["keys"], "an unreadable date must not read as done")
        self.assertEqual(got[5], [])
        # Both enrolled, not yet enforced: ENFORCE is offered (the server
        # re-checks both enrolments and aal2 before it switches anything on).
        self.assertEqual(got[6], [{"kind": "enforce"}])
        # ...and never while any owner account is unenrolled.
        self.assertNotIn({"kind": "enforce"}, got[2])

    def test_checklist_writes_check_the_result(self):
        # CLAUDE.md 8.1 class 1: the row may only leave on a confirmed ok.
        src = read("omega-owner-deck.js")
        # DONE is recorded by the secrets-health Edge Function (service role,
        # docs/decisions/secrets-health/PLAN.md), not claimed by the page.
        helper = src[src.index("function health(action)"):src.index("function showKeys(")]
        self.assertIn("sb.functions.invoke('secrets-health'", helper)
        self.assertIn("res.error", helper)
        blk = src[src.index("health('confirm')"):]
        blk = blk[:blk.index("r.appendChild(done)")]
        self.assertIn("d.ok !== true || d.recorded !== true", blk)
        self.assertNotIn("owner_confirm_secrets_rotated", src)
        self.assertNotIn("innerHTML", src)

    def test_secrets_health_never_returns_a_key(self):
        fn = read("supabase/functions/secrets-health/index.ts")
        # Only the owner, through the caller's own JWT (aal2 once enforced).
        self.assertIn('asCaller.rpc("owner_security_status")', fn)
        # Secret values are read per key only after the owner gate. valueOf() is
        # defined above the handler; what matters is where it is called.
        self.assertLess(fn.index('owner_security_status'), fn.index('const value = valueOf(name)'))
        # Per key: flags, a status code and an 8-hex hash. Never the value,
        # never a provider body.
        self.assertIn("return { name, label, set: true, live: probe.live, status: probe.status, fp, changed:", fn)
        self.assertLess(fn.index("auth.getUser("), fn.index("createClient(supabaseUrl, serviceKey"))
        self.assertIn("slice(0, 4)", fn)
        self.assertNotIn("console.", fn)
        self.assertNotIn("res.text()", fn)
        self.assertNotIn("?apikey=", fn)
        # Recorded server-side, only on a clean write, only while keys work.
        self.assertIn('if (!allLive) return json({ ...result, ok: false, error: "key_failing" }', fn)
        self.assertIn('if (write.error) return json({ ...result, ok: false, error: "record_failed" }', fn)


class SecurityRpcShape(unittest.TestCase):
    """Advisor lint 0029: no SECURITY DEFINER function in the exposed schema.
    Both migrations keep the definer body in private behind an invoker wrapper,
    and anon can execute neither half."""

    FILES = ("20260926222245_feedback_consent_invoker_wrappers.sql",
             "20260926223027_owner_security_checklist.sql")

    def test_public_wrappers_are_invokers_and_anon_is_revoked(self):
        for name in self.FILES:
            sql = read(os.path.join("supabase", "migrations", name)).lower()
            body = re.sub(r"--[^\n]*", "", sql)
            publics = re.findall(r"create or replace function public\.(\w+)\((.*?)\$\$", body, re.S)
            self.assertTrue(publics, name)
            for fn, head in publics:
                self.assertIn("security invoker", head, "%s: public.%s" % (name, fn))
                self.assertNotIn("security definer", head, "%s: public.%s" % (name, fn))
                self.assertRegex(body, r"revoke execute on function public\.%s\([^)]*\) from public, anon" % fn)
                self.assertRegex(body, r"revoke execute on function private\.%s\([^)]*\) from public, anon" % fn)


if __name__ == "__main__":
    unittest.main()
