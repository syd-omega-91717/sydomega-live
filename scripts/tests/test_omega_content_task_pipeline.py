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
        self.assertIn("task('ROLLBACK_REQUIRED'", js)
        self.assertIn("cleanup_state:'CONFIRMED'", js)
        self.assertIn("REGISTRATION_UNCERTAIN", js)
        self.assertNotIn("from('storage_files')", js)

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
        self.assertIn("assertUploadSize(objectBlob.size)", js)
        self.assertIn("bytes.byteLength !== sizeBytes", js)
        self.assertIn("object.metadata?.mimetype", js)
        self.assertIn("storage.remove([path])", js)
        self.assertIn("CONTENT_INGEST_ROLLBACK", js)
        self.assertIn('Cache-Control', js)

    def test_delivery_is_owner_only_signed_and_does_not_leak_provider_errors(self):
        js = (ROOT / "supabase/functions/content-delivery/index.ts").read_text()
        self.assertIn('if (file.owner_id !== userId)', js)
        self.assertIn('createSignedUrl(file.storage_path, 900, { download: true })', js)
        self.assertIn('event_type: "capability_used"', js)
        self.assertIn('Cache-Control', js)
        self.assertIn('content_delivery_failed', js)
        self.assertNotIn('error: error.message', js)

    def test_provider_deployment_evidence_matches_live_inventory(self):
        pipeline = json.loads((ROOT / "config/omega-content-task-pipeline.json").read_text())
        snapshot = json.loads((ROOT / "docs/runtime/supabase-edge-functions-live.json").read_text())
        for name in ("content-ingest", "content-delivery"):
            with self.subTest(function=name):
                evidence = pipeline["provider_evidence"]["functions"][name]
                live = snapshot["functions"][name]
                self.assertEqual(evidence["status"], "DEPLOYED")
                self.assertEqual(evidence["live_version"], live["version"])
                self.assertEqual(evidence["verify_jwt"], live["verify_jwt"])
                self.assertEqual(live["state"], "DEPLOYED")
                self.assertEqual(live["provider_status"], "ACTIVE")
                self.assertEqual(live["source_parity"], "EXACT_ENTRYPOINT_MATCH")

        self.assertEqual(pipeline["upload"]["bucket_enforcement"]["file_size_limit_bytes"], 52428800)
        self.assertEqual(pipeline["upload"]["bucket_enforcement"]["source_migration"],
                         "20261117004605_uploads_bucket_size_limit_50mb")
        self.assertEqual(pipeline["truth_states"]["rights"], "UNVERIFIED")
        self.assertEqual(pipeline["truth_states"]["publication"], "UNVERIFIED")
        self.assertEqual(pipeline["truth_states"]["scan"], "UNAVAILABLE_UNLESS_PROVIDER_EVIDENCE_EXISTS")

    def test_no_client_write_to_storage_files(self):
        js = (ROOT / "omega-content-tasks.js").read_text()
        self.assertNotRegex(js, r"from\(['\"]storage_files['\"]\)\s*\.insert")
        self.assertNotRegex(js, r"from\(['\"]storage_files['\"]\)\s*\.update")
        uploader = (ROOT / "upload.js").read_text()
        self.assertIn("upload(path,file,{upsert:false", uploader)



    def test_publishing_archive_uses_owner_scoped_short_lived_signed_attachment_delivery(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("select('kind,title,body,file_path,created_at,status')", page)
        self.assertIn("function isOwnedUploadPath(path)", page)
        self.assertIn("path.indexOf(userId+'/')!==0", page)
        self.assertIn("attachPrivateDownload(d.querySelector('.work-body'),w.file_path)", page)
        self.assertIn("signedUrl('uploads',path,900)", page)
        self.assertIn("tab.location.replace(url)", page)
        self.assertNotIn("getPublicUrl(", page)

    def test_publishing_archive_renders_database_fields_without_html_interpolation(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertNotIn("d.innerHTML=", page)
        self.assertIn("titleNode.textContent=w.title||'Untitled'", page)
        self.assertIn("document.createTextNode(String(w.kind||''))", page)
        self.assertIn("workContent.textContent=w.body||''", page)
        self.assertIn("status.textContent=stl", page)

    def test_marketing_campaign_attachment_is_owner_scoped_and_short_lived(self):
        page = (ROOT / "marketing.html").read_text()
        self.assertIn("select('zone,duration,title,message,price_omega,status,created_at,file_path')", page)
        self.assertIn("path.indexOf(_user.id+'/')!==0", page)
        self.assertIn("parts.length!==2", page)
        self.assertIn("signedUrl('uploads',path,900)", page)
        self.assertIn("tab.location.replace(url)", page)
        self.assertIn("attachPrivateCampaignDownload(d,q.file_path)", page)
        self.assertNotIn("getPublicUrl(", page)

    def test_owner_reservation_review_download_is_private_owner_scoped_and_short_lived(self):
        page = (ROOT / "approvals.js").read_text()
        start = page.index("function attachReservationDownload")
        end = page.index("async function loadAudit()", start)
        queue = page[start:end]
        self.assertIn("row.file_path", queue)
        self.assertIn("path.startsWith(row.user_id+'/')", queue)
        self.assertIn("parts.length!==2", queue)
        self.assertIn("createSignedUrl(path,300,{download:true})", queue)
        self.assertIn("window.open('about:blank','_blank')", queue)
        self.assertIn("tab.location.replace(result.data.signedUrl)", queue)
        self.assertIn("status.textContent='Private download link expires in 5 minutes.'", queue)
        self.assertNotIn("getPublicUrl(", queue)
        self.assertNotIn("innerHTML", queue)
        self.assertIn("where public.is_platform_owner()", (ROOT / "supabase/migrations/0012_omega_marketing.sql").read_text())

    def test_reservation_decisions_are_bigint_owner_aal2_and_audited(self):
        page = (ROOT / "marketing.html").read_text()
        self.assertNotIn("from('media_reservations').update(", page)
        self.assertIn("sb.rpc('set_reservation_status',args)", page)
        self.assertIn("mfa.stepUp()", page)
        self.assertIn(".in('status',['submitted','pending','reviewing'])", page)
        migration = (ROOT / "supabase/migrations/20261118090000_owner_aal2_media_reservation_decisions.sql").read_text()
        self.assertIn("revoke update on table public.media_reservations from public, anon, authenticated", migration.lower())
        self.assertIn("set_reservation_status(p_id bigint, p_status text)", migration)
        self.assertIn("auth.jwt()->>'aal'", migration)
        self.assertIn("'aal2_required'", migration)
        self.assertIn("'invalid_status_transition'", migration)
        self.assertIn("insert into public.omega_platform_events", migration.lower())
        self.assertIn("revoke all on function public.set_reservation_status(uuid, text)", migration.lower())
        self.assertIn("grant execute on function public.set_reservation_status(bigint, text) to authenticated", migration.lower())

    def test_legacy_publication_upload_compensates_only_definitive_database_rejections(self):
        page = (ROOT / "publishing.html").read_text()
        self.assertIn("COMMIT STATUS UNKNOWN — THE UPLOADED FILE WAS PRESERVED", page)
        self.assertIn("/^[0-9A-Z]{5}$/.test(code)", page)
        self.assertIn("OmegaStorage.remove('uploads',filePath)", page)
        self.assertIn("FILE CLEANUP UNCONFIRMED — SUPPORT REVIEW REQUIRED", page)

    def test_legacy_marketing_upload_compensates_only_definitive_database_rejections(self):
        page = (ROOT / "marketing.html").read_text()
        self.assertIn("SUBMISSION STATUS UNKNOWN — FILE PRESERVED", page)
        self.assertIn("/^[0-9A-Z]{5}$/.test(code)", page)
        self.assertIn("OmegaStorage.remove('uploads',filePath)", page)
        self.assertIn("FILE CLEANUP UNCONFIRMED — SUPPORT REVIEW REQUIRED", page)

if __name__ == "__main__":
    unittest.main()
