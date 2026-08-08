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
