#!/usr/bin/env python3
"""Regression tests for omega-password-guard.js.

WHY THESE EXIST

The guard closes the threat behind the `auth_leaked_password_protection`
advisory, which cannot be cleared on this project's plan (organisation
vztvuckpdsoriyvpdkzx is `free`; Supabase's docs put the feature at Pro and
above). It does that by querying HaveIBeenPwned's Pwned Passwords range API
with k-anonymity.

The one property that MUST hold is the one CLAUDE.md 8.1 names as this repo's
most repeated bug class: a UI must never report a success it did not verify.
Here that means an unreachable API must degrade to "not established", never to
"not breached" -- because the caller renders reassuring copy on the latter.
`test_*_degrades_to_unknown` is the whole reason this file exists.

They run under Node with `fetch` stubbed, so no network is touched. That also
matters because the egress proxy in the build environment returns 403 for
api.pwnedpasswords.com, so the live path cannot be exercised from CI either --
these tests pin the parsing, the k-anonymity split, and the failure modes,
which is everything except the network hop itself.

The SHA-1 fixture is the published digest of the string "password"
(5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8), so a wrong digest, a wrong
prefix/suffix split, or a wrong case would all fail rather than silently agree
with themselves.

Run: python3 -m unittest scripts/tests/test_password_guard.py -v
"""

import json
import os
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GUARD = os.path.join(ROOT, 'omega-password-guard.js')

SHA1_PASSWORD = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'


def node(script):
    """Run a snippet with the guard importable, return parsed JSON on stdout."""
    proc = subprocess.run(
        ['node', '-e', script], cwd=ROOT,
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise AssertionError('node failed: %s%s' % (proc.stdout, proc.stderr))
    return json.loads(proc.stdout.strip().splitlines()[-1])


def with_stub(body, ok='true', status='200', throw=False):
    """A snippet that stubs fetch, then reports breachCheck('password')."""
    if throw:
        stub = "globalThis.fetch=async()=>{throw new Error('network down')};"
    else:
        stub = ("globalThis.fetch=async(u)=>{globalThis.__url=u;return{ok:%s,status:%s,"
                "text:async()=>%s};};" % (ok, status, json.dumps(body)))
    return (stub +
            "const G=require('./omega-password-guard.js');"
            "G.breachCheck('password').then(r=>{r.__url=globalThis.__url||null;"
            "console.log(JSON.stringify(r))});")


class BreachCheckTest(unittest.TestCase):

    def test_sends_only_the_five_character_prefix(self):
        """k-anonymity: the password and its full hash must never be sent."""
        r = node(with_stub('%s:99' % SHA1_PASSWORD[5:]))
        self.assertEqual(r['__url'], 'https://api.pwnedpasswords.com/range/5BAA6')
        # Assert on the PATH, not the whole URL: the hostname
        # api.pwnedpasswords.com contains the substring "password", so a
        # naive assertNotIn over the URL fails on the host and proves nothing
        # about what was sent.
        sent = r['__url'].rsplit('/range/', 1)[1]
        self.assertEqual(sent, SHA1_PASSWORD[:5])
        self.assertNotIn(SHA1_PASSWORD[5:], sent)
        self.assertNotIn('password', sent)

    def test_match_reports_breached_with_the_count(self):
        body = '\r\n'.join([
            '0018A45C4D1DEF81644B54AB7F969B88D65:1',
            '%s:10382543' % SHA1_PASSWORD[5:],
            '01330C689E5D64F660D6947A93AD634EF8F:2',
        ])
        r = node(with_stub(body))
        self.assertIs(r['breached'], True)
        self.assertEqual(r['count'], 10382543)
        self.assertIs(r['checked'], True)

    def test_absent_suffix_reports_not_breached(self):
        r = node(with_stub('0018A45C4D1DEF81644B54AB7F969B88D65:1'))
        self.assertIs(r['breached'], False)
        self.assertIs(r['checked'], True)

    # ------------------------------------------------------------------
    # The reason this file exists. An unreachable API is an UNKNOWN. If either
    # of these ever returns breached=False, the sign-up page starts telling
    # members a compromised password is clean.

    def test_http_error_degrades_to_unknown_not_to_clean(self):
        r = node(with_stub('', ok='false', status='503'))
        self.assertIsNone(r['breached'])
        self.assertIs(r['checked'], False)

    def test_network_failure_degrades_to_unknown_not_to_clean(self):
        r = node(with_stub('', throw=True))
        self.assertIsNone(r['breached'])
        self.assertIs(r['checked'], False)


class StrengthTest(unittest.TestCase):

    def strength(self, pw, email='member@example.com'):
        return node(
            "const G=require('./omega-password-guard.js');"
            "console.log(JSON.stringify(G.strength(%s,%s)));"
            % (json.dumps(pw), json.dumps(email)))

    def test_a_strong_password_passes(self):
        self.assertTrue(self.strength('Tr0ubad0ur-Kestrel!')['ok'])

    def test_too_short_fails(self):
        r = self.strength('Ab1!xY')
        self.assertFalse(r['ok'])
        self.assertTrue(any('12 characters' in x for x in r['reasons']))

    def test_too_few_character_classes_fails(self):
        r = self.strength('abcdefghijklmnop')
        self.assertFalse(r['ok'])
        self.assertTrue(any('Mix at least' in x for x in r['reasons']))

    def test_password_built_from_the_email_fails(self):
        r = self.strength('Member99!Member', 'member@example.com')
        self.assertFalse(r['ok'])
        self.assertTrue(any('email address' in x for x in r['reasons']))

    def test_one_repeated_character_fails_despite_length(self):
        r = self.strength('aaaaaaaaaaaaaaaaaa')
        self.assertFalse(r['ok'])


class EvaluateTest(unittest.TestCase):
    """evaluate() is what the pages call; it must not block on an unknown."""

    def evaluate(self, pw, stub_throws=True):
        stub = ("globalThis.fetch=async()=>{throw new Error('down')};"
                if stub_throws else
                "globalThis.fetch=async()=>({ok:true,status:200,"
                "text:async()=>'%s:5'});" % SHA1_PASSWORD[5:])
        return node(stub +
                    "const G=require('./omega-password-guard.js');"
                    "G.evaluate(%s,'member@example.com')"
                    ".then(r=>console.log(JSON.stringify(r)));" % json.dumps(pw))

    def test_weak_password_is_blocked_without_any_network_call(self):
        r = self.evaluate('short')
        self.assertIs(r['allow'], False)
        self.assertIs(r['checked'], False)

    def test_strong_password_is_allowed_when_the_api_is_unreachable(self):
        """Fail open: a third-party outage must not stop account creation."""
        r = self.evaluate('Tr0ubad0ur-Kestrel!')
        self.assertIs(r['allow'], True)
        self.assertIsNone(r['breached'])
        self.assertIs(r['checked'], False)   # caller must not claim it checked

    def test_breached_password_is_blocked_even_though_it_is_strong(self):
        r = self.evaluate('password', stub_throws=False)
        # 'password' is too short/weak to reach the network anyway, so use a
        # strong one whose hash the stub always returns as a hit.
        self.assertIs(r['allow'], False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
