#!/usr/bin/env python3
"""Regression tests for truthful client-side content cleanup state."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class ContentClientRollbackTests(unittest.TestCase):
    def test_cleanup_requires_successful_owner_authorized_storage_removal(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("async function cleanupUploaded(path)", js)
        # Client-side Storage DELETE is not authorized; the function must not attempt it
        self.assertNotIn("root.OmegaStorage.remove('uploads',path)", js)
        self.assertIn("// Client-side Storage DELETE is not authorized", js)
        self.assertIn("return false;", js)
        self.assertIn("cleanup_state:'UNCONFIRMED'", js)
        self.assertIn("registrationStarted=true", js)
        self.assertIn("REGISTRATION_UNCERTAIN", js)
        self.assertIn("registered.error&&!registered.data", js)

    def test_rolled_back_state_requires_confirmed_cleanup(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("function cleanupTask(error,path,confirmed)", js)
        self.assertIn("confirmed\n    ? task('ROLLED_BACK'", js)
        self.assertIn("cleanup_state:'CONFIRMED'", js)
        self.assertIn("task('ROLLBACK_REQUIRED'", js)

    def test_upload_never_overwrites_existing_object_before_registration(self):
        js = (ROOT / "upload.js").read_text()
        self.assertIn("upload(path,file,{upsert:false", js)
        self.assertIn("item.name===path", js)
        self.assertIn("Storage deletion was not confirmed.", js)

    def test_unexpected_upload_and_download_errors_are_handled(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("UNEXPECTED_PIPELINE_ERROR", js)
        self.assertIn("DELIVERY_UNAVAILABLE", js)
        self.assertIn("FUNCTION_INVOCATION_FAILED", js)
        self.assertNotIn("error:_error.message", js)
        self.assertNotIn("error: _error.message", js)

    def test_import_ui_does_not_claim_orphan_removal_without_evidence(self):
        js = (ROOT / "omega-content-import.js").read_text()
        self.assertIn("r.state==='ROLLED_BACK'&&r.data&&r.data.cleanup_state==='CONFIRMED'", js)
        self.assertIn("r.state==='ROLLBACK_REQUIRED'", js)
        self.assertIn("CLEANUP NOT CONFIRMED", js)
        self.assertNotIn("NO ORPHAN UPLOAD KEPT", js)
        self.assertIn("REGISTRATION STATUS UNKNOWN", js)


if __name__ == "__main__":
    unittest.main()
