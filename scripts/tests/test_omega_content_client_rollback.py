#!/usr/bin/env python3
"""Regression tests for truthful client-side content cleanup state."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class ContentClientRollbackTests(unittest.TestCase):
    def test_cleanup_requires_confirmed_storage_removal(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("async function cleanupUploaded(path)", js)
        self.assertIn("return !!removed&&!removed.error", js)
        self.assertIn("catch(_error){return false;}", js)
        self.assertIn("task('ROLLBACK_REQUIRED'", js)
        self.assertIn("cleanup_state:'UNCONFIRMED'", js)

    def test_rolled_back_state_is_only_returned_after_cleanup_confirmation(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("cleaned\n        ? task('ROLLED_BACK'", js)
        self.assertIn("cleanup_state:'CONFIRMED'", js)
        self.assertIn("typeof uploaded.path==='string'&&uploaded.path", js)

    def test_unexpected_upload_and_download_errors_are_handled(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("UNEXPECTED_PIPELINE_ERROR", js)
        self.assertIn("DELIVERY_UNAVAILABLE", js)
        self.assertNotIn("error:_error.message", js)
        self.assertNotIn("error: _error.message", js)

    def test_import_ui_does_not_claim_orphan_removal_without_evidence(self):
        js = (ROOT / "omega-content-import.js").read_text()
        self.assertIn("r.state==='ROLLED_BACK'&&r.data&&r.data.cleanup_state==='CONFIRMED'", js)
        self.assertIn("r.state==='ROLLBACK_REQUIRED'", js)
        self.assertIn("CLEANUP NOT CONFIRMED", js)
        self.assertNotIn("NO ORPHAN UPLOAD KEPT", js)


if __name__ == "__main__":
    unittest.main()
