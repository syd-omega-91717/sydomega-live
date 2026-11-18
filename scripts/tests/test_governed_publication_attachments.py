#!/usr/bin/env python3
"""Regression tests for the backward-compatible governed publication attachment bridge."""
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[2]

class GovernedPublicationAttachmentTests(unittest.TestCase):
    def test_migration_preserves_legacy_paths_and_enforces_owner_matched_content(self):
        sql = (ROOT / "supabase/migrations/20261118120000_governed_publication_attachments.sql").read_text().lower()
        self.assertIn("add column if not exists content_file_id uuid", sql)
        self.assertIn("foreign key (content_file_id, user_id)", sql)
        self.assertIn("references public.storage_files (id, owner_id)", sql)
        self.assertIn("on delete set null (content_file_id)", sql)
        self.assertIn("content_file_id is null or (user_id is not null and file_path is null)", sql)
        self.assertNotIn("drop column", sql)
        self.assertNotIn("update public.publications", sql)

    def test_new_uploads_use_governed_ingest_and_keep_legacy_paths_for_reads(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("OmegaContentTasks.upload(fEl.files[0]", page)
        self.assertIn("content_file_id:contentFileId", page)
        self.assertIn("file_path:null", page)
        self.assertNotIn("OmegaStorage.upload('uploads',fEl.files[0])", page)
        self.assertIn("ATTACHMENT NOT REGISTERED", page)
        self.assertIn("REGISTERED · PENDING REVIEW · MALWARE SCAN UNAVAILABLE", page)
        self.assertIn("if(w.content_file_id)attachGovernedPrivateDownload", page)
        self.assertIn("else if(w.file_path)attachPrivateDownload", page)
        self.assertIn("OmegaContentTasks.signedDownload(fileId)", page)
        self.assertIn("signedUrl('uploads',path,900)", page)
        self.assertNotIn("getPublicUrl(", page)

    def test_content_helper_uses_the_existing_authenticated_page_client(self):
        helper = (ROOT / "omega-content-tasks.js").read_text()
        self.assertIn("root.__omegaSb||root.supabaseClient||null", helper)
        self.assertIn("REGISTRATION_UNCERTAIN", helper)

    def test_production_migration_is_explicitly_pending_and_hash_pinned(self):
        manifest = (ROOT / "supabase/pending-migrations.json").read_text()
        workflow = (ROOT / ".github/workflows/supabase-controlled-migration-push.yml").read_text()
        self.assertIn('"version": "20261118120000"', manifest)
        self.assertIn('"blocksProduction": true', manifest)
        self.assertIn('elif version == "20261118120000":', workflow)
        self.assertIn("Publication attachment migration bytes differ", workflow)
        self.assertIn("dbc051dc7a59d22a28732ec263f8a5e7f4d4848b8c29410188c667a74ea7226a", workflow)

    def test_failed_parent_insert_never_blindly_deletes_registered_content(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("REGISTERED PRIVATE FILE WAS PRESERVED", page)
        self.assertIn("NO UNSAFE CLIENT-SIDE DELETE WAS ATTEMPTED", page)

if __name__ == "__main__":
    unittest.main()
