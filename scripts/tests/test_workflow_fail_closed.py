from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / "omega-workflow.js"


class WorkflowFailClosedContract(unittest.TestCase):
    def setUp(self):
        self.source = WORKFLOW.read_text(encoding="utf-8")

    def test_executor_rejects_missing_steps(self):
        self.assertIn("error:'step_not_implemented'", self.source)
        self.assertIn("entry.status='failed'", self.source)

    def test_executor_stops_on_explicit_step_failure(self):
        self.assertIn("if(result&&result.ok===false)", self.source)
        self.assertIn("failed_step:stepName", self.source)
        self.assertIn("return {ok:entry.status==='completed'", self.source)

    def test_gate_record_failure_is_not_reported_as_success(self):
        self.assertIn("error:'gate_event_record_failed'", self.source)
        self.assertIn("return {ok:false,error:'gate_event_record_failed'", self.source)

    def test_dedication_rpc_failure_is_not_reported_as_success(self):
        self.assertIn("return {ok:false,error:'rpc_error'", self.source)
        self.assertNotIn("return {ok:true,skipped:'rpc_error'", self.source)

    def test_report_queries_fail_closed_instead_of_inventing_zero_data(self):
        self.assertIn("error:'task_query_failed'", self.source)
        self.assertIn("error:'dedication_query_failed'", self.source)
        self.assertNotIn("catch(e){return {ok:true,_tasks_count:0};}", self.source)
        self.assertNotIn("catch(e){return {ok:true,_dedications:[]};}", self.source)


if __name__ == "__main__":
    unittest.main()
