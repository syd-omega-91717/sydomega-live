"""Focus local history remains primary while cloud mirroring is durable and idempotent."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "focus.html").read_text(encoding="utf-8")


class FocusSessionRetryContract(unittest.TestCase):
    def test_new_sessions_have_stable_secure_uuid(self):
        self.assertIn("function createFocusSessionId()", PAGE)
        self.assertIn("c.randomUUID()", PAGE)
        self.assertIn("c.getRandomValues(b)", PAGE)
        self.assertIn("syncStatus:id?'pending':'local_only'", PAGE)

    def test_local_record_is_persisted_before_cloud_mirror(self):
        save = PAGE[PAGE.index("function saveSession()"):PAGE.index("DURABLE SERVER MIRROR")]
        self.assertLess(save.index("localStorage.setItem(STORE_KEY"), save.index("mirrorFocusSession(record)"))

    def test_durable_queue_is_written_before_network_attempt(self):
        mirror = PAGE[PAGE.index("async function mirrorFocusSession(record)"):PAGE.index("async function flushFocusMirrorQueue()")]
        self.assertIn("MIRROR_QUEUE_KEY", mirror)
        self.assertIn("persistFocusMirrorQueue(queue)", mirror)
        self.assertLess(mirror.index("persistFocusMirrorQueue(queue)"), mirror.index("await flushFocusMirrorQueue()"))

    def test_primary_key_upsert_is_append_only_and_confirmed(self):
        flush = PAGE[PAGE.index("async function flushFocusMirrorQueue()"):PAGE.index("function getSessions()")]
        self.assertIn("onConflict:'id',ignoreDuplicates:true", flush)
        self.assertIn(".eq('id',item.id).eq('user_id',user.id).maybeSingle()", flush)
        self.assertNotIn(".from('focus_sessions').insert(", flush)

    def test_retry_is_bounded_and_event_driven(self):
        self.assertIn("function focusRetryDelay(attempts)", PAGE)
        self.assertIn("Math.min(60*60*1000", PAGE)
        self.assertIn("window.addEventListener('online',flushFocusMirrorQueue)", PAGE)
        self.assertIn("window.addEventListener('pageshow',flushFocusMirrorQueue)", PAGE)
        self.assertIn("document.addEventListener('visibilitychange'", PAGE)

    def test_account_ownership_is_never_reassigned_silently(self):
        flush = PAGE[PAGE.index("async function flushFocusMirrorQueue()"):PAGE.index("function getSessions()")]
        self.assertIn("item.userId===user.id", flush)
        self.assertIn("PENDING SESSIONS BELONG TO ANOTHER ACCOUNT", flush)

    def test_unknown_legacy_state_is_not_claimed_as_synced(self):
        status = PAGE[PAGE.index("function renderFocusMirrorStatus()"):PAGE.index("async function mirrorFocusSession(record)")]
        self.assertIn("CLOUD STATE UNKNOWN", status)
        self.assertIn("CLOUD MIRROR CURRENT", status)


if __name__ == "__main__":
    unittest.main()
