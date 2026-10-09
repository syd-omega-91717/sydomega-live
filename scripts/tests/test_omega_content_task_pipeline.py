#!/usr/bin/env python3
"""Static contract tests for the governed content upload/download pipeline."""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]

class ContentTaskPipelineTests(unittest.TestCase):
    def test_contract_is_explicitly_not_publication(self):
        c=json.loads((ROOT/"config/omega-content-task-pipeline.json").read_text())
        self.assertEqual(c["principle"],"UPLOAD_IS_NOT_PUBLICATION")
        self.assertIn("registration_does_not_prove_rights",c["upload"]["rules"])
        self.assertIn("public_download_is_never_inferred_from_storage_path",c["download"]["rules"])

    def test_client_pipeline_rolls_back_orphan_on_registration_failure(self):
        js=(ROOT/"omega-content-tasks.js").read_text()
        self.assertIn("content-ingest",js)
        self.assertIn("OmegaStorage.remove('uploads',uploaded.path)",js)

    def test_ingest_requires_authenticated_owner_path(self):
        js=(ROOT/"supabase/functions/content-ingest/index.ts").read_text()
        self.assertIn('if (!userId)',js)
        self.assertIn('if (!path.startsWith(userId + "/"))',js)
        self.assertIn('from("storage_files")',js)
        self.assertIn('event_type: "evidence_recorded"',js)

    def test_delivery_is_owner_only_and_signed(self):
        js=(ROOT/"supabase/functions/content-delivery/index.ts").read_text()
        self.assertIn('if (file.owner_id !== userId)',js)
        self.assertIn('createSignedUrl(file.storage_path, 900)',js)
        self.assertIn('event_type: "capability_used"',js)

    def test_no_client_write_to_storage_files(self):
        js=(ROOT/"omega-content-tasks.js").read_text()
        self.assertNotRegex(js,r"from\(['\"]storage_files['\"]\)\s*\.insert")
        self.assertNotRegex(js,r"from\(['\"]storage_files['\"]\)\s*\.update")

if __name__=="__main__":
    unittest.main()
