#!/usr/bin/env python3
"""Tests for scripts/erasure-policy-contract.py (docs/legal/ERASURE_PLAN.md finding 9).

The contract makes classifying a new member-data table a merge requirement. Every "must pass" case is
paired with a violator, because a gate that stopped reporting would satisfy the passing cases on its own
(CLAUDE.md 8.4). The first test runs the real contract on the real files, so CI enforces it without a
workflow change.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "erasure-policy-contract.py")


def run(schema, policy, *args, migrations=None):
    with tempfile.TemporaryDirectory() as d:
        sp, pp = os.path.join(d, "schema.json"), os.path.join(d, "policy.json")
        md = os.path.join(d, "migrations")
        os.makedirs(md)
        for name, sql in (migrations or {}).items():
            with open(os.path.join(md, name), "w") as fh:
                fh.write(sql)
        with open(sp, "w") as fh:
            json.dump(schema, fh)
        with open(pp, "w") as fh:
            json.dump(policy, fh)
        r = subprocess.run([sys.executable, SCRIPT, "--schema", sp, "--policy", pp, "--migrations", md, *args], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def row(action="delete", reviewed=True, why="member's own rows"):
    return {"action": action, "reviewed": reviewed, "why": why}


SCHEMA = {"tables": {
    "public.profiles": ["id", "email"],
    "public.notes": ["id", "user_id", "body"],
    "public.teams": ["id", "owner_id", "name"],
    "public.catalog": ["id", "title"],          # no member or reference column: not required
    "auth.users": ["id", "user_id"],            # not public: ignored
}}


class RealFiles(unittest.TestCase):
    def test_the_real_policy_covers_the_real_snapshot(self):
        r = subprocess.run([sys.executable, SCRIPT], capture_output=True, text=True, cwd=ROOT)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("classified", r.stdout)


class Synthetic(unittest.TestCase):
    def good(self):
        return {"tables": {"notes": row(), "teams": row("anonymise")}}

    def test_complete_policy_passes_and_exempts_profiles_other_schemas_and_unrelated_tables(self):
        code, out = run(SCHEMA, self.good())
        self.assertEqual(code, 0, out)

    def test_a_new_table_with_a_user_id_must_be_classified(self):
        """VIOLATOR, the whole point: a table added next month cannot merge unclassified."""
        schema = json.loads(json.dumps(SCHEMA))
        schema["tables"]["public.messages"] = ["id", "user_id"]
        code, out = run(schema, self.good())
        self.assertEqual(code, 1, out)
        self.assertIn("unclassified: public.messages", out)

    def test_a_table_with_only_an_owner_id_must_be_classified(self):
        """VIOLATOR. 29 such tables were never swept at all."""
        policy = {"tables": {"notes": row()}}
        code, out = run(SCHEMA, policy)
        self.assertEqual(code, 1, out)
        self.assertIn("public.teams", out)

    def test_a_stale_entry_fails(self):
        policy = self.good()
        policy["tables"]["gone"] = row()
        code, out = run(SCHEMA, policy)
        self.assertEqual(code, 1, out)
        self.assertIn("stale: gone", out)

    def test_unknown_action_empty_reason_and_non_bool_reviewed_fail(self):
        for bad, needle in (
            ({"action": "erase", "reviewed": True, "why": "x"}, "is not one of"),
            ({"action": "delete", "reviewed": True, "why": "  "}, "missing 'why'"),
            ({"action": "delete", "reviewed": "yes", "why": "x"}, "'reviewed' must be"),
        ):
            policy = self.good()
            policy["tables"]["notes"] = bad
            code, out = run(SCHEMA, policy)
            self.assertEqual(code, 1, out)
            self.assertIn(needle, out)

    def test_empty_policy_fails(self):
        code, out = run(SCHEMA, {"tables": {}})
        self.assertEqual(code, 1, out)

    def test_pending_and_unreviewed_rows_pass_by_default_but_fail_the_gate(self):
        """The default mode lets work proceed; --gate is what must pass before the worker is enabled."""
        policy = {"tables": {"notes": row("pending_decision", reviewed=False), "teams": row("delete", reviewed=False)}}
        code, out = run(SCHEMA, policy)
        self.assertEqual(code, 0, out)
        code, out = run(SCHEMA, policy, "--gate")
        self.assertEqual(code, 1, out)
        self.assertIn("gate: notes is still pending_decision", out)
        self.assertIn("gate: teams is not reviewed", out)

    def test_gate_passes_when_everything_is_decided_and_reviewed(self):
        code, out = run(SCHEMA, self.good(), "--gate")
        self.assertEqual(code, 0, out)

    def test_missing_input_files_fail(self):
        r = subprocess.run([sys.executable, SCRIPT, "--schema", "/nonexistent.json"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 1)
        self.assertIn("cannot read inputs", r.stdout)


class FromMigrations(unittest.TestCase):
    """The snapshot is dated, so the contract also reads the migrations (a replica replay found six tables
    created after the snapshot that the snapshot-only check could not see)."""

    def good(self):
        return {"tables": {"notes": row(), "teams": row("anonymise")}}

    def test_a_table_created_by_a_migration_with_a_user_id_must_be_classified(self):
        """VIOLATOR: absent from the snapshot, present only in a migration."""
        code, out = run(SCHEMA, self.good(), migrations={"20261101000000_a.sql": "create table public.diary (id uuid primary key, user_id uuid not null references auth.users(id));"})
        self.assertEqual(code, 1, out)
        self.assertIn("unclassified: public.diary", out)

    def test_it_passes_once_that_table_is_classified(self):
        policy = self.good()
        policy["tables"]["diary"] = row()
        code, out = run(SCHEMA, policy, migrations={"20261101000000_a.sql": "create table if not exists public.diary (id uuid primary key, user_id uuid not null);"})
        self.assertEqual(code, 0, out)

    def test_a_member_column_added_later_by_alter_table_is_found(self):
        sql = "create table public.logs (id uuid primary key);\nalter table public.logs add column if not exists profile_id uuid;"
        code, out = run(SCHEMA, self.good(), migrations={"20261101000000_a.sql": sql})
        self.assertEqual(code, 1, out)
        self.assertIn("public.logs", out)

    def test_a_table_dropped_by_a_later_migration_is_not_required(self):
        """The replica measurement found omega_agent_action_proposals this way."""
        m = {"20261101000000_a.sql": "create table public.tmp (id uuid, user_id uuid);", "20261102000000_b.sql": "drop table if exists public.tmp;"}
        code, out = run(SCHEMA, self.good(), migrations=m)
        self.assertEqual(code, 0, out)

    def test_a_table_with_no_member_column_is_not_required(self):
        code, out = run(SCHEMA, self.good(), migrations={"20261101000000_a.sql": "create table public.catalog2 (id uuid primary key, title text);"})
        self.assertEqual(code, 0, out)

    def test_commented_out_sql_is_ignored(self):
        sql = "-- create table public.ghost (id uuid, user_id uuid);\n/* create table public.ghost2 (id uuid, user_id uuid); */"
        code, out = run(SCHEMA, self.good(), migrations={"20261101000000_a.sql": sql})
        self.assertEqual(code, 0, out)

    def test_a_policy_entry_for_a_migration_table_is_not_stale(self):
        policy = self.good()
        policy["tables"]["fresh_job_queue"] = row("pending_decision", reviewed=False)
        code, out = run(SCHEMA, policy, migrations={"20261101000000_a.sql": "create table public.fresh_job_queue (id uuid, owner_id uuid);"})
        self.assertEqual(code, 0, out)


if __name__ == "__main__":
    unittest.main()
