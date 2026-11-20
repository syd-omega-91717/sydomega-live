#!/usr/bin/env python3
"""Regression contract for truthful governed marketplace attachment outcomes.

A content-ingest success is already registered and audited. If the parent
listing write fails or becomes ambiguous, the browser must preserve the private
object for reconciliation instead of deleting Storage bytes and leaving a
dangling storage_files record.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "marketplace.html").read_text(encoding="utf-8")


class MarketplaceUploadRollbackContract(unittest.TestCase):
    def test_insert_exception_preserves_registered_file_and_requests_reconciliation(self):
        block = PAGE.split("var ins=await sb.from('marketplace_listings').insert", 1)[1].split("if(!ins || ins.error)", 1)[0]
        self.assertIn("catch(_)", block)
        self.assertIn("showListingStatusUnknown(msg,file_path)", block)
        helper = PAGE.split("function showListingStatusUnknown", 1)[1].split("async function reconcileListingInsertFailure", 1)[0]
        self.assertIn("REGISTERED PRIVATE FILE PRESERVED", helper)
        self.assertIn("Refresh MY LISTINGS", helper)
        self.assertIn("request support reconciliation before retrying", helper)

    def test_definite_postgres_rejection_preserves_registered_content(self):
        block = PAGE.split("async function reconcileListingInsertFailure", 1)[1].split("document.getElementById('btn-pub')", 1)[0]
        self.assertIn("typeof ins.error.code==='string'", block)
        self.assertIn("/^[0-9A-Z]{5}$/.test(code)", block)
        self.assertIn("if(!/^[0-9A-Z]{5}$/.test(code))", block)
        self.assertIn("REGISTERED PRIVATE FILE PRESERVED", block)
        self.assertIn("SUPPORT RECONCILIATION REQUIRED", block)
        self.assertNotIn("OmegaStorage.remove", block)

    def test_parent_write_failure_never_attempts_client_side_storage_cleanup(self):
        block = PAGE.split("async function reconcileListingInsertFailure", 1)[1].split("document.getElementById('btn-pub')", 1)[0]
        self.assertNotIn("cleanup&&!cleanup.error", block)
        self.assertNotIn("window.OmegaStorage.remove", block)
        self.assertIn("content-ingest has already registered and audited this object", block)
        self.assertIn("preserve it for support reconciliation", block)

    def test_ambiguous_error_does_not_delete_the_uploaded_object(self):
        block = PAGE.split("async function reconcileListingInsertFailure", 1)[1].split("document.getElementById('btn-pub')", 1)[0]
        ambiguous = block.split("if(!/^[0-9A-Z]{5}$/.test(code))", 1)[1].split("msg.style.display='block'", 1)[0]
        self.assertNotIn("OmegaStorage.remove", ambiguous)
        self.assertIn("showListingStatusUnknown(msg,file_path)", ambiguous)

    def test_success_progress_event_follows_insert_resolution(self):
        insert_pos = PAGE.index("ins=await sb.from('marketplace_listings').insert")
        progress_pos = PAGE.index("OmegaProgress&&OmegaProgress.record({kind:'marketplace'")
        self.assertGreater(progress_pos, insert_pos)
        self.assertIn("if(!ins || ins.error)", PAGE[insert_pos:progress_pos])


if __name__ == "__main__":
    unittest.main()
