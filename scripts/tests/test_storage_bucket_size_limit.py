from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261117004605_uploads_bucket_size_limit_50mb.sql"
UPLOAD_HELPER = ROOT / "upload.js"
PIPELINE = ROOT / "config/omega-content-task-pipeline.json"


class StorageBucketSizeLimitTests(unittest.TestCase):
    def test_server_bucket_limit_matches_client_ceiling(self):
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        helper = UPLOAD_HELPER.read_text(encoding="utf-8")
        self.assertIn("where id = 'uploads'", sql)
        self.assertIn("set file_size_limit = 52428800", sql)
        self.assertIn("bucket_limit is distinct from 52428800", sql)
        self.assertIn("bucket_public is distinct from false", sql)
        self.assertIn("var max=50*1024*1024", helper.lower())
        self.assertIn("file_size_limit", sql)

    def test_migration_does_not_change_mime_allowlist_or_public_avatar_bucket(self):
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        self.assertNotIn("allowed_mime_types", sql)
        self.assertNotIn("where id = 'avatars'", sql)
        self.assertNotIn("set public = true", sql)
        self.assertNotIn("set public = false", sql)

    def test_upload_pipeline_marks_signature_and_malware_validation_as_separate_gates(self):
        import json
        pipeline = json.loads(PIPELINE.read_text(encoding="utf-8"))
        rules = pipeline["upload"]["rules"]
        self.assertIn("registration_does_not_prove_malware_scan", rules)
        self.assertIn("registration_does_not_prove_rights", rules)
        self.assertEqual(pipeline["upload"]["required"]["authentication"], True)


if __name__ == "__main__":
    unittest.main()
