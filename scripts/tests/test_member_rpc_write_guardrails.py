#!/usr/bin/env python3
"""Static regression tests for member-owned RPC write-amplification controls."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION = "20261017114500"
FILENAME = VERSION + "_member_rpc_write_guardrails_20261017.sql"
MIGRATION = ROOT / "supabase" / "migrations" / FILENAME


class MemberRpcWriteGuardrailsContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding="utf-8")
        cls.simulation_js = (ROOT / "omega-simulation-arena.js").read_text(encoding="utf-8")
        cls.arena_html = (ROOT / "arena.html").read_text(encoding="utf-8")
        cls.remote = json.loads((ROOT / "supabase" / "remote-migrations.json").read_text(encoding="utf-8"))
        cls.pending = json.loads((ROOT / "supabase" / "pending-migrations.json").read_text(encoding="utf-8"))

    def test_migration_is_pending_and_never_claimed_live(self):
        entry = next((item for item in self.pending.get("pending", []) if item.get("version") == VERSION), None)
        self.assertIsNotNone(entry)
        self.assertEqual(entry.get("file"), FILENAME)
        self.assertEqual(entry.get("status"), "PENDING_REVIEW")
        self.assertEqual(entry.get("liveStatus"), "NOT_APPLIED")
        self.assertIs(entry.get("blocksProduction"), True)
        self.assertNotIn(VERSION, self.remote.get("versions", []))

    def test_simulation_model_contract_matches_shipped_client(self):
        for model in ("realm_balance", "mission_route", "arena_resilience"):
            self.assertIn("'" + model + "'", self.sql)
            self.assertIn("key:'" + model + "'", self.simulation_js)
        self.assertIn("MODEL_VERSION='1.0.0'", self.simulation_js)
        self.assertIn("p_model_version <> '1.0.0'", self.sql)
        self.assertIn("p_deterministic_seed NOT BETWEEN 1 AND 2147483647", self.sql)
        self.assertIn("NOT BETWEEN 1 AND 100", self.sql)
        self.assertIn("NOT BETWEEN 10 AND 100", self.sql)
        self.assertIn("NOT BETWEEN 3 AND 18", self.sql)
        self.assertIn("v_recent_count >= 20", self.sql)
        self.assertIn("interval '1 hour'", self.sql)
        self.assertIn('max="2147483647"', self.arena_html)

    def test_simulation_result_shape_is_validated_server_side(self):
        for key in ("score", "stability", "adaptation", "efficiency", "resilience", "energy_remaining", "trace"):
            self.assertIn("'" + key + "'", self.sql)
        self.assertIn("jsonb_array_length(p_result_snapshot -> 'trace') NOT BETWEEN 3 AND 18", self.sql)
        self.assertIn("invalid_result_trace_values", self.sql)
        self.assertIn("result_metric_out_of_range", self.sql)
        self.assertIn("result_snapshot_too_large", self.sql)

    def test_world_action_writes_are_serialized_idempotent_and_rate_limited(self):
        self.assertIn("pg_advisory_xact_lock", self.sql)
        self.assertIn("v_recent_count >= 120", self.sql)
        self.assertIn("interval '1 minute'", self.sql)
        self.assertIn("EXCEPTION WHEN unique_violation", self.sql)
        self.assertIn("metadata ->> 'idempotency_key' = p_idempotency_key", self.sql)
        self.assertIn("world_action_rate_limited", self.sql)

    def test_public_rpc_is_invoker_only_and_privileged_implementation_is_private(self):
        self.assertIn("CREATE SCHEMA IF NOT EXISTS omega_private", self.sql)
        self.assertIn("GRANT USAGE ON SCHEMA omega_private TO authenticated", self.sql)
        self.assertIn("CREATE OR REPLACE FUNCTION omega_private.omega_record_simulation_run", self.sql)
        self.assertIn("CREATE OR REPLACE FUNCTION omega_private.omega_record_world_action", self.sql)
        self.assertIn("CREATE OR REPLACE FUNCTION public.omega_record_simulation_run", self.sql)
        self.assertIn("CREATE OR REPLACE FUNCTION public.omega_record_world_action", self.sql)
        self.assertGreaterEqual(self.sql.count("SECURITY INVOKER"), 2)
        self.assertIn("SECURITY INVOKER PostgREST wrapper", self.sql)
        self.assertNotIn("CREATE OR REPLACE FUNCTION public.omega_record_simulation_run(\n  p_model_key text,\n  p_model_version text,\n  p_deterministic_seed bigint,\n  p_input_snapshot jsonb,\n  p_result_snapshot jsonb\n)\nRETURNS public.omega_simulation_runs\nLANGUAGE plpgsql\nSECURITY DEFINER", self.sql)

    def test_privileged_write_boundaries_remain_narrow(self):
        self.assertGreaterEqual(self.sql.lower().count("security definer"), 2)
        self.assertGreaterEqual(self.sql.lower().count("set search_path = ''"), 2)
        self.assertGreaterEqual(self.sql.count("SELECT auth.uid()"), 2)
        self.assertIn("FROM PUBLIC, anon", self.sql)
        self.assertGreaterEqual(self.sql.count("TO authenticated"), 2)
        self.assertIn("omega_platform_events", self.sql)
        self.assertIn("omega_simulation_runs", self.sql)


if __name__ == "__main__":
    unittest.main()
