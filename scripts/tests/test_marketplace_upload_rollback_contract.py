#!/usr/bin/env python3
"""Regression contract for truthful marketplace upload rollback.

A successful Storage upload followed by a rejected listing insert must not
leave an untracked object silently, and an ambiguous insert must never delete
a file that a committed listing may reference.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "marketplace.html").read_text(encoding="utf-8")


class MarketplaceUploadRollbackContract(unittest.TestCase):
    def test_listing_insert_exception_preserves_file_and_avoids_duplicate_retry(self):
        block = PAGE.split("var ins=await sb.from('marketplace_listings').insert", 1)[1].split("if(!ins || ins.error)", 1)[0]
        self.assertIn("catch(_)", block)
        self.assertIn("FILE PRESERVED TO AVOID DATA LOSS", block)
        self.assertIn("Refresh MY LISTINGS before retrying", block)
        self.assertIn("avoid a duplicate", block)

    def test_only_definite_postgres_rejection_triggers_cleanup(self):
        block = PAGE.split("async function reconcileListingInsertFailure", 1)[1].split("document.getElementById('btn-pub')", 1)[0]
        self.assertIn("typeof ins.error.code==='string'", block)
        self.assertIn("/^[0-9A-Z]{5}$/.test(ins.error.code)", block)
        self.assertIn("window.OmegaStorage.remove('uploads',file_path)", block)
        self.assertIn("if(!sqlState)", block)

    def test_cleanup_success_requires_storage_helper_confirmation(self):
        block = PAGE.split("async function reconcileListingInsertFailure", 1)[1].split("document.getElementById('btn-pub')", 1)[0]
        self.assertIn("cleanup&&!cleanup.error", block)
        self.assertIn("UPLOAD ROLLED BACK", block)
        self.assertIn("FILE CLEANUP UNCONFIRMED", block)
        self.assertIn("SUPPORT REVIEW REQUIRED", block)

    def test_ambiguous_error_does_not_delete_the_uploaded_object(self):
        block = PAGE.split("if(ins.error)", 1)[1].split("window.OmegaProgress", 1)[0]
        ambiguous = block.split("if(!/^[0-9A-Z]{5}$/.test(code))", 1)[1].split("msg.style.display='block'", 1)[0]
        self.assertNotIn("OmegaStorage.remove", ambiguous)
        self.assertIn("FILE PRESERVED TO AVOID DATA LOSS", ambiguous)

    def test_no_success_progress_event_precedes_insert_resolution(self):
        insert_pos = PAGE.index("ins=await sb.from('marketplace_listings').insert")
        progress_pos = PAGE.index("OmegaProgress&&OmegaProgress.record({kind:'marketplace'")
        self.assertGreater(progress_pos, insert_pos)
        self.assertIn("if(ins.error)", PAGE[insert_pos:progress_pos])


if __name__ == "__main__":
    unittest.main()
