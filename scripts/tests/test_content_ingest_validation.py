from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
FUNCTION = ROOT / "supabase/functions/content-ingest/index.ts"
DELIVERY = ROOT / "supabase/functions/content-delivery/index.ts"
HELPER = ROOT / "supabase/functions/_shared/content-validation.mjs"
NODE_TEST = ROOT / "scripts/tests/content-validation.test.mjs"


class ContentIngestValidationTests(unittest.TestCase):
    def test_ingest_downloads_and_validates_actual_object_bytes(self):
        source = FUNCTION.read_text(encoding="utf-8")
        self.assertIn('from "../_shared/content-validation.mjs"', source)
        self.assertIn("storage.download(path)", source)
        self.assertIn("assertUploadSize(objectBlob.size)", source)
        self.assertIn("detectMime(bytes)", source)
        self.assertIn("sha256Hex(bytes)", source)
        self.assertIn("bytes.byteLength !== sizeBytes", source)

    def test_persisted_metadata_uses_detected_type_and_checksum(self):
        source = FUNCTION.read_text(encoding="utf-8")
        self.assertIn("mime_type: mimeType", source)
        self.assertIn("size_bytes: sizeBytes", source)
        self.assertIn("checksum,", source)
        self.assertIn("declared_mime_type: declaredMimeType", source)
        self.assertIn('scan_state: "UNAVAILABLE"', source)
        self.assertIn('rights_state: "UNVERIFIED"', source)
        self.assertNotIn("checksum: null", source)

    def test_private_content_delivery_forces_attachment_download(self):
        source = DELIVERY.read_text(encoding="utf-8")
        self.assertIn(".createSignedUrl(file.storage_path, 900, { download: true })", source)
        self.assertIn('delivery: "signed_attachment"', source)
        self.assertIn('delivery_state: "SIGNED_ATTACHMENT"', source)
        self.assertNotIn(".getPublicUrl(", source)

    def test_unknown_binary_is_not_promoted_to_a_claimed_mime_type(self):
        helper = HELPER.read_text(encoding="utf-8")
        self.assertIn('return "application/octet-stream"', helper)
        self.assertIn("UNRECOGNIZED_BINARY", FUNCTION.read_text(encoding="utf-8"))
        self.assertNotIn("malware_scan_passed", FUNCTION.read_text(encoding="utf-8"))

    @unittest.skipIf(shutil.which("node") is None, "node not available")
    def test_signature_and_hash_unit_suite(self):
        result = subprocess.run(
            ["node", "--test", str(NODE_TEST)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=30,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
