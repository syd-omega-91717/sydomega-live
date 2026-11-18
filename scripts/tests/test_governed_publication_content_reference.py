#!/usr/bin/env python3
"""Regression tests for the no-schema governed publication content-reference bridge."""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]

class GovernedPublicationContentReferenceTests(unittest.TestCase):
    def test_new_attachments_use_registered_content_uri_in_existing_column(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("OmegaContentTasks.upload(fEl.files[0]", page)
        self.assertIn("omega-content://storage_files/", page)
        self.assertIn("file_path:contentFileRef", page)
        self.assertIn("REGISTERED · PENDING REVIEW · MALWARE SCAN UNAVAILABLE", page)
        self.assertNotIn("OmegaStorage.upload('uploads',fEl.files[0])", page)

    def test_archive_dispatches_typed_content_refs_and_preserves_legacy_path_fallback(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("var contentRefPrefix='omega-content://storage_files/'", page)
        self.assertIn("attachGovernedPrivateDownload(d.querySelector('.work-body'),contentId)", page)
        self.assertIn("else if(w.file_path)attachPrivateDownload(d.querySelector('.work-body'),w.file_path)", page)
        self.assertIn("OmegaContentTasks.signedDownload(fileId)", page)
        self.assertIn("signedUrl('uploads',path,900)", page)
        self.assertNotIn("getPublicUrl(", page)

    def test_reference_format_is_uuid_and_documented_without_schema_migration(self):
        config = json.loads((ROOT / "config/omega-content-task-pipeline.json").read_text())
        contract = config["publication_attachment_reference"]
        self.assertEqual(contract["format"], "omega-content://storage_files/<uuid>")
        self.assertEqual(contract["storage_column"], "publications.file_path")
        self.assertEqual(contract["access"], "owner_only")
        self.assertEqual(contract["truth_states"]["malware_scan"], "UNAVAILABLE")
        self.assertRegex("omega-content://storage_files/123e4567-e89b-42d3-a456-426614174000",
                         r"^omega-content://storage_files/[0-9a-f-]{36}$")
        self.assertFalse((ROOT / "supabase/migrations/20261118120000_governed_publication_attachments.sql").exists())

    def test_upload_helper_shares_the_page_supabase_client(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("window.OmegaSB=window.OmegaSB||{get:function(){return Promise.resolve(sb);}}", page)
        self.assertIn('<script type="module" src="/upload.js"></script>', page)

    def test_content_helper_uses_existing_authenticated_page_client(self):
        helper = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("root.__omegaSb||root.supabaseClient||null", helper)

    def test_registered_content_is_preserved_if_parent_record_write_fails(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("REGISTERED PRIVATE FILE WAS PRESERVED", page)
        self.assertIn("NO UNSAFE CLIENT-SIDE DELETE WAS ATTEMPTED", page)

if __name__ == "__main__":
    unittest.main()
