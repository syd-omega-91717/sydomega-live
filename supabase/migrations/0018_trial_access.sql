-- =============================================================================
-- SYD OMEGA 91717 -- TRIAL ACCESS SYSTEM
-- 9.1717-minute timed sessions with auto-expiry and full progress reset
-- Run once in Supabase SQL Editor
-- =============================================================================

/* --- 1. Add trial columns to profiles --- */
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_trial       BOOLEAN    DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT NULL;

/* --- 2. GRANT TRIAL ACCESS (called by approvals page) ---
   Sets access_approved = true, marks as trial, stamps expiry at exactly
   9.1717 minutes (= 550.302 seconds) from now.
   Owner (is_owner = true) is never set as trial. */
-- Defensive drop: later migrations (trial_917.sql, chronometers.sql) redefine
-- this to RETURN timestamptz instead of void. On a database that already has
-- that later signature (a real, actively-used project -- not the empty
-- database this file was first validated against), the undefended
-- CREATE OR REPLACE below fails with 42P13. See 0004's my_matrix() fix for
-- the same pattern.
DROP FUNCTION IF EXISTS grant_trial_access(UUID);
CREATE OR REPLACE FUNCTION grant_trial_access(p_uid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    access_approved   = true,
    is_trial          = true,
    trial_expires_at  = NOW() + INTERVAL '550.302 seconds'
  WHERE id = p_uid AND (is_owner IS NULL OR is_owner = false);
END;
$$;

/* --- 3. EXPIRE TRIAL (called by client when countdown hits zero) ---
   Revokes access, clears trial flags, resets all three matrix axes to genesis
   values (1.0), and wipes the member's task_completions so progress is clean. */
-- Defensive drop: omega_master_deploy.sql (runs first) already creates
-- expire_trial(uuid) RETURNING jsonb; this redefines it to RETURN void,
-- which Postgres rejects without a DROP first (42P13) -- fails even on a
-- freshly-applied database, not just an existing one.
DROP FUNCTION IF EXISTS expire_trial(UUID);
CREATE OR REPLACE FUNCTION expire_trial(p_uid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    access_approved   = false,
    is_trial          = false,
    trial_expires_at  = NULL,
    axis_a            = 1.0,
    axis_b            = 1.0,
    axis_c            = 1.0
  WHERE id = p_uid;

  DELETE FROM task_completions WHERE user_id = p_uid;
END;
$$;

/* --- 4. GRANT PERMANENT ACCESS (owner override, no timer) --- */
-- Defensive drop: same reason as expire_trial above -- omega_master_deploy.sql
-- already creates this returning jsonb; redefining it to void without a drop
-- first fails with 42P13 even on a freshly-applied database.
DROP FUNCTION IF EXISTS grant_permanent_access(UUID);
CREATE OR REPLACE FUNCTION grant_permanent_access(p_uid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    access_approved   = true,
    is_trial          = false,
    trial_expires_at  = NULL
  WHERE id = p_uid;
END;
$$;

/* --- 5. Allow authenticated users to call expire_trial on their own record --- */
GRANT EXECUTE ON FUNCTION expire_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_trial_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_permanent_access(UUID) TO authenticated;
