#!/usr/bin/env python3
"""Static contract tests for the governed content upload/download pipeline."""
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[2]


class ContentTaskPipelineTests(unittest.TestCase):
    def test_contract_is_explicitly_not_publication(self):
        c = json.loads((ROOT / "config/omega-content-task-pipeline.json").read_text())
        self.assertEqual(c["principle"], "UPLOAD_IS_NOT_PUBLICATION")
        self.assertEqual(c["status"], "IMPLEMENTED_PROVIDER_DEPLOYED")
        self.assertEqual(c["provider_evidence"]["functions"]["content-ingest"]["verify_jwt"], True)
        self.assertEqual(c["provider_evidence"]["functions"]["content-delivery"]["verify_jwt"], True)
        self.assertIn("registration_does_not_prove_rights", c["upload"]["rules"])
        self.assertIn("public_download_is_never_inferred_from_storage_path", c["download"]["rules"])

    def test_client_rollback_is_confirmed_and_does_not_write_metadata(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("content-ingest", js)
        self.assertIn("async function cleanupUploaded(path)", js)
        self.assertIn("root.OmegaStorage.remove('uploads',path)", js)
        self.assertIn("task('ROLLBACK_REQUIRED'", js)
        self.assertIn("cleanup_state:'CONFIRMED'", js)

    def test_ingest_requires_authenticated_and_segment_validated_owner_path(self):
        js = (ROOT / "supabase/functions/content-ingest/index.ts").read_text()
        self.assertIn("if (!userId)", js)
        self.assertIn("function parseOwnedPath", js)
        self.assertIn("if (parts[0] !== userId)", js)
        self.assertIn('part === ".."', js)
        self.assertIn('part.includes("\\\\")', js)
        self.assertIn('from("storage_files")', js)
        self.assertIn('event_type: "evidence_recorded"', js)

    def test_ingest_uses_storage_metadata_and_compensates_failed_audit(self):
        js = (ROOT / "supabase/functions/content-ingest/index.ts").read_text()
        self.assertIn("object.metadata?.size", js)
        self.assertIn("object.metadata?.mimetype", js)
        self.assertIn("storage.remove([path])", js)
        self.assertIn("CONTENT_INGEST_ROLLBACK", js)
        self.assertIn('Cache-Control', js)

    def test_delivery_is_owner_only_signed_and_does_not_leak_provider_errors(self):
        js = (ROOT / "supabase/functions/content-delivery/index.ts").read_text()
        self.assertIn('if (file.owner_id !== userId)', js)
        self.assertIn('createSignedUrl(file.storage_path, 900)', js)
        self.assertIn('event_type: "capability_used"', js)
        self.assertIn('Cache-Control', js)
        self.assertIn('content_delivery_failed', js)
        self.assertNotIn('error: error.message', js)

    def test_no_client_write_to_storage_files(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertNotRegex(js, r"from\(['\"]storage_files['\"]\)\s*\.insert")
        self.assertNotRegex(js, r"from\(['\"]storage_files['\"]\)\s*\.update")
        uploader = (ROOT / "upload.js").read_text()
        self.assertIn("upload(path,file,{upsert:false", uploader)


if __name__ == "__main__":
    unittest.main()
