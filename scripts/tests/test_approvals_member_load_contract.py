#!/usr/bin/env python3
"""Regression contract for approvals.html member-list loading.

A failed get_all_members RPC used to resolve as {data: null, error: ...}; the
catch-only fallback therefore never ran and the owner saw a false zero-member
state. Both the RPC and fallback must check returned errors, and total failure
must remain visibly unavailable rather than being represented as empty data.
"""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "approvals.js").read_text(encoding="utf-8")
START = SOURCE.index("async function load(){")
END = SOURCE.index("\n\n/* ── ACTIONS ── */", START)
LOAD = SOURCE[START:END]


class MemberLoadContract(unittest.TestCase):
    def test_rpc_error_result_is_not_treated_as_an_empty_list(self):
        self.assertIn("if(r&&r.error)throw new Error", LOAD)
        self.assertIn("Array.isArray(r.data)", LOAD)
        self.assertIn("get_all_members_invalid_response", LOAD)

    def test_fallback_checks_returned_error_and_response_shape(self):
        self.assertIn("if(r2&&r2.error)throw new Error", LOAD)
        self.assertIn("Array.isArray(r2.data)", LOAD)
        self.assertIn("profiles_query_invalid_response", LOAD)

    def test_double_failure_uses_unknown_state_not_zero_counts(self):
        self.assertIn("el.textContent='—'", LOAD)
        self.assertIn("MEMBER DATA UNAVAILABLE", LOAD)
        self.assertIn("COULD NOT LOAD MEMBER DATA", LOAD)
        self.assertLess(LOAD.index("return;"), LOAD.index("allMembers=members.filter"))

    def test_failure_state_offers_a_retry_without_inserting_error_html(self):
        self.assertIn("list.replaceChildren()", LOAD)
        self.assertIn("message.textContent=", LOAD)
        self.assertIn("retry.addEventListener('click',function(){load();})", LOAD)
        self.assertNotIn("list.innerHTML=String", LOAD)

    def test_successful_fallback_is_observable(self):
        self.assertIn("console.warn('[OMEGA] get_all_members failed; owner-scoped profiles fallback succeeded.'", LOAD)
        self.assertIn("MEMBER DATA DEGRADED", LOAD)

    def test_successful_empty_result_remains_a_real_empty_state(self):
        self.assertIn("if(!cards.length)", LOAD)
        self.assertIn("t('empty_no_members')", LOAD)


class ReviewQueueContract(unittest.TestCase):
    def test_review_queues_check_supabase_errors(self):
        queue_start = SOURCE.index("/* ── QUEUE LOADERS ── */")
        queue_end = SOURCE.index("/* ── IDENTITY REVIEW", queue_start)
        queues = SOURCE[queue_start:queue_end]
        for name in ("loadContracts", "loadReservations", "loadAudit", "loadErrors"):
            with self.subTest(queue=name):
                start = queues.index("async function " + name + "(")
                next_start = queues.find("\nasync function ", start + 1)
                body = queues[start:next_start if next_start >= 0 else len(queues)]
                self.assertIn("if(r&&r.error)throw new Error", body)
                self.assertIn("showQueueError(", body)

    def test_queue_errors_show_retry_state_not_empty_state(self):
        queue_start = SOURCE.index("/* ── QUEUE LOADERS ── */")
        queue_end = SOURCE.index("/* ── IDENTITY REVIEW", queue_start)
        queues = SOURCE[queue_start:queue_end]
        self.assertIn("function showQueueError(", queues)
        self.assertIn("message.textContent=t(key)", queues)
        self.assertIn("retry.addEventListener('click',function(){retryLoad();})", queues)
        self.assertIn("Array.isArray(r.data.rows)", queues)


if __name__ == "__main__":
    unittest.main()
