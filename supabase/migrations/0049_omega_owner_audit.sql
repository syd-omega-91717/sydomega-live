-- ============================================================================
-- SYD OMEGA 91717 -- OWNER FLAG AUDIT & CLEANUP
-- Run the SELECT first (step 1) to see exactly which accounts currently have
-- is_owner=true. There should be exactly one (or two, if both founder emails
-- have separate accounts). If there are more, that's the actual cause of
-- friends seeing the owner's profile content -- the gating logic checks
-- is_owner correctly, but if it's wrongly set on their account, they get
-- shown the (hardcoded, real) owner content because the flag says they are
-- the owner.
-- ============================================================================

-- STEP 1 -- DIAGNOSE. Run this first, look at the results.
SELECT p.id, u.email, p.display_name, p.is_owner, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_owner = true
ORDER BY p.created_at;

-- Also check platform_owners directly -- this is the table is_platform_owner()
-- actually reads from. It should exactly mirror the query above.
SELECT po.user_id, u.email
FROM public.platform_owners po
JOIN auth.users u ON u.id = po.user_id;

-- ============================================================================
-- STEP 2 -- FIX. Only run this after confirming step 1 shows accounts that
-- should NOT be owner. This safely resets is_owner=false for every account
-- except the two real founder emails. The existing sync trigger on profiles
-- automatically removes any wrongly-added rows from platform_owners too --
-- no separate cleanup needed there.
-- ============================================================================
-- UNCOMMENT AND RUN ONLY AFTER REVIEWING STEP 1:
--
-- UPDATE public.profiles p
-- SET is_owner = false
-- FROM auth.users u
-- WHERE p.id = u.id
--   AND p.is_owner = true
--   AND lower(u.email) NOT IN ('s.y.dagher@gmail.com','slmndghr@gmail.com');
--
-- Re-confirm afterward by re-running STEP 1 -- it should show only the real
-- founder account(s).
