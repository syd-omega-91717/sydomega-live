-- ============================================================================
-- SYD OMEGA 91717 -- NOTIFICATIONS TABLE FIX
-- omega-notify.js (injected platform-wide by bg.js on every approved page --
-- 104+ pages) queries public.notifications for the badge/toast/panel widget:
--   omega-notify.js:78   .from('notifications').select('*').eq('user_id',...)
--   omega-notify.js:88   .from('notifications').update({read_at:...})...
--   omega-notify.js:107  .from('notifications').select('id',{count:'exact'})...
-- reading columns user_id, notification_type, message, content, created_at,
-- read_at -- but no CREATE TABLE for notifications exists anywhere in
-- supabase/*.sql. The Supabase JS client doesn't throw on a missing-relation
-- error, it resolves {data: null, error}, so this has always failed
-- silently: the badge always shows 0, the panel always shows "NO
-- NOTIFICATIONS", and the "mark as read" update silently no-ops, for every
-- member on every page, with no visible error.
--
-- This is a distinct table from public.dispatches (the global owner-broadcast
-- channel behind notifications.html/news.html -- one row read by everyone,
-- no per-user state). omega-notify.js's shape is inherently per-user
-- (user_id, read_at per row), so it cannot be satisfied by dispatches
-- without inventing per-user read-state columns on a table that's
-- deliberately shared. Kept as its own table instead.
--
-- Matching the same precedent as omega_user_assets_fix.sql: this fix adds
-- the missing table + RLS so reads/updates stop failing, but does not wire
-- up any INSERT -- nothing in the codebase currently writes a notification
-- row anywhere, so deciding which server-side events (access approved,
-- trial started, task completed, etc.) should generate one is separate
-- product/engineering work, left undone on purpose. Until something inserts
-- rows, the widget will correctly show zero notifications instead of
-- erroring -- same visible behavior as today, minus the silent failure.
--
-- Idempotent, safe to re-run.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid()
);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id           uuid NOT NULL DEFAULT auth.uid();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS notification_type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message           text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content           text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at        timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at           timestamptz;

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- members read/update only their own notifications; the owner reads all
DROP POLICY IF EXISTS notif_select ON public.notifications;
CREATE POLICY notif_select ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- omega-notify.js only ever updates read_at on its own rows (mark-as-read)
DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;

COMMIT;
-- ===== end omega_notifications_fix.sql =====
