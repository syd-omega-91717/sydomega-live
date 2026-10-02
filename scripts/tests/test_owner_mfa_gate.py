#!/usr/bin/env python3
"""
Owner two-factor: the sign-in step-up and the lockout-safe enforce switch
(docs/decisions/owner-mfa/PLAN.md, 2026-09-27 addendum).

The plan named the missing step: stepUp() had no caller, so with
owner_mfa_required on an owner's next password sign-in would be aal1,
is_platform_owner() would return false and every owner power would fail
silently. omega-mfa-gate.js asks for the code on every guarded page;
owner_set_mfa_required() refuses to switch enforcement on unless the caller is
at aal2 and BOTH owner accounts hold a verified factor.

Measured in the harness (scratchpad mfa-gate.js, stubbed auth.mfa):
  aal1 -> aal2 due : dialog, buttons [Confirm, Sign out], Escape ignored,
                     code -> challenge, verify, refreshSession, gate=passed
  Sign out         : auth.signOut() then /account.html
  no factor        : no dialog      outage (throws): no dialog, no sign-out
  public pages     : no approval guard, so the gate never acts
Live (rolled back): see the migration header.

Run: python3 -m unittest scripts/tests/test_owner_mfa_gate.py -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(*p):
    with open(os.path.join(ROOT, *p), encoding="utf-8") as f:
        return f.read()


GATE = read("omega-mfa-gate.js")
MFA = read("omega-mfa.js")
BG = read("bg.js")
DECK = read("omega-owner-deck.js")
MIG = read("supabase", "migrations", "20260927123649_owner_mfa_enforce_switch.sql")


class Gate(unittest.TestCase):
    def test_injected_by_bg_with_its_own_guard(self):
        self.assertIn("omega-mfa-gate.js", BG)
        self.assertIn("data-omega-mfa-gate", BG)
        # CLAUDE.md 8.1 class 5(b): a guard attribute is the module's identity.
        self.assertNotIn("data-omega-mfa-mod", BG)

    def test_acts_only_where_bg_installed_the_approval_guard(self):
        self.assertIn("if (!document.getElementById('omega-approval-guard')) return;", GATE)

    def test_asks_only_when_a_factor_is_waiting(self):
        self.assertIn("d.currentLevel !== 'aal1' || d.nextLevel !== 'aal2'", GATE)

    def test_outage_never_signs_out(self):
        self.assertIn(".catch(function () { /* an outage must never lock anyone out */ })", GATE)
        self.assertEqual(GATE.count("signOut("), 1)
        self.assertIn("if (res === 'signout')", GATE)

    def test_required_prompt_has_no_escape_hatch(self):
        self.assertIn("if (e.key === 'Escape' && !required) done(false);", MFA)
        self.assertIn("done(required ? 'signout' : false)", MFA)
        self.assertIn("return required ? null : false;", MFA)

    def test_code_refreshes_the_jwt(self):
        # the aal claim lives in the JWT; without a refresh the tab stays aal1
        self.assertIn("sb.auth.refreshSession()", MFA)


class EnforceSwitch(unittest.TestCase):
    def test_server_refuses_unless_caller_aal2_and_all_owners_enrolled(self):
        body = MIG[MIG.index("function private.owner_set_mfa_required"):]
        self.assertLess(body.index("private.is_platform_owner()"), body.index("step_up_first"))
        self.assertIn("coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2'", body)
        self.assertIn("'owners_not_enrolled'", body)
        self.assertIn("f.status = 'verified'", body)

    def test_not_callable_by_anon(self):
        for sig in ("private.owner_set_mfa_required(boolean)", "public.owner_set_mfa_required(boolean)"):
            self.assertRegex(MIG, r"revoke execute on function %s from public, anon" % re.escape(sig))

    def test_deck_offers_enforce_only_when_every_owner_enrolled(self):
        self.assertIn("if (!items.length && (st.owners || []).length && st.owner_mfa_required !== true) items.push({ kind: 'enforce' });", DECK)

    def test_deck_steps_up_then_retries_and_checks_ok(self):
        body = DECK[DECK.index("function enforceRow("):DECK.index("function keysRow(")]
        self.assertIn("res.data.error === 'step_up_first'", body)
        self.assertIn("M.stepUp()", body)
        self.assertIn("res.data.ok !== true", body)


if __name__ == "__main__":
    unittest.main()
